import React, { useState, useEffect, useRef } from 'react';
import '../styles.css';
import { useParams, useNavigate } from 'react-router-dom';
import Peer from 'peerjs';
import CodeEditor from './CodeEditor';
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaPhoneSlash } from 'react-icons/fa';

const MeetingPage = ({ socket }) => {
    const { roomId } = useParams();
    const [peer, setPeer] = useState(null);
    const [myStream, setMyStream] = useState(null);
    const [peers, setPeers] = useState({});
    const [remoteStreams, setRemoteStreams] = useState({});

    const [isMicMuted, setIsMicMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [message, setMessage] = useState('');

    const myVideoRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!socket || !roomId) return;
        socket.emit('join-room', roomId);
    }, [socket, roomId]);

    useEffect(() => {
        const newPeer = new Peer(undefined, {
            host: 'localhost',
            port: 5000,
            path: '/peerjs',
        });

        setPeer(newPeer);

        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                setMyStream(stream);
                if (myVideoRef.current) {
                    myVideoRef.current.srcObject = stream;
                }
            })
            .catch(err => console.error('Failed to get media stream:', err));

        return () => {
            newPeer.destroy();
            if (myStream) {
                myStream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    useEffect(() => {
        if (!peer || !socket || !myStream) return;

        socket.on('all-users', (users) => {
            users.forEach(userId => {
                const call = peer.call(userId, myStream);
                call.on('stream', remoteStream => {
                    addRemoteStream(userId, remoteStream);
                });
                call.on('close', () => {
                    removeRemoteStream(userId);
                });
                setPeers(prev => ({ ...prev, [userId]: call }));
            });
        });

        socket.on('user-joined', (userId) => {
            console.log('User joined:', userId);
        });

        socket.on('user-left', (userId) => {
            console.log('User left:', userId);
            if (peers[userId]) {
                peers[userId].close();
                setPeers(prev => {
                    const updated = { ...prev };
                    delete updated[userId];
                    return updated;
                });
                removeRemoteStream(userId);
            }
        });

        peer.on('call', (call) => {
            call.answer(myStream);
            call.on('stream', (remoteStream) => {
                addRemoteStream(call.peer, remoteStream);
            });
            call.on('close', () => {
                removeRemoteStream(call.peer);
            });
            setPeers(prev => ({ ...prev, [call.peer]: call }));
        });

        return () => {
            socket.off('all-users');
            socket.off('user-joined');
            socket.off('user-left');
            peer.off('call');
        };
    }, [peer, socket, myStream, peers]);

    const addRemoteStream = (peerId, stream) => {
        setRemoteStreams(prev => ({ ...prev, [peerId]: stream }));
    };

    const removeRemoteStream = (peerId) => {
        setRemoteStreams(prev => {
            const updated = { ...prev };
            delete updated[peerId];
            return updated;
        });
    };

    const toggleMic = () => {
        if (myStream) {
            myStream.getAudioTracks().forEach(track => {
                track.enabled = isMicMuted; // if muted, enable; else disable
            });
            setIsMicMuted(!isMicMuted);
        }
    };

    const toggleCamera = () => {
        if (myStream) {
            const videoTrack = myStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsCameraOff(!videoTrack.enabled);
            }
        }
    };

    const leaveCall = () => {
        Object.values(peers).forEach(call => call.close());
        setPeers({});
        Object.values(remoteStreams).forEach(stream => {
            stream.getTracks().forEach(track => track.stop());
        });
        setRemoteStreams({});
        if (myStream) {
            myStream.getTracks().forEach(track => track.stop());
            setMyStream(null);
        }
        if (myVideoRef.current) {
            myVideoRef.current.srcObject = null;
        }
        setMessage('You left the meeting successfully 😊');

        setTimeout(() => {
            navigate('/');
        }, 2000);
    };

    return (
        <div className="meeting-container flex flex-col p-4 max-w-full h-screen bg-gray-100">
            <div className="meeting-header text-center mb-6">
                <h1 className="text-3xl font-bold text-blue-600 mb-1">CodeMeet</h1>
                <p className="text-sm text-gray-500">
                    Room ID: <span className="font-mono">{roomId}</span>
                </p>
            </div>

            {message && (
                <div className="text-green-600 text-center mb-4 font-medium">
                    {message}
                </div>
            )}

            {/* Main layout */}
            <div className="flex gap-6 flex-grow overflow-hidden">
                {/* Left: Videos and controls */}
                <div className="flex flex-col items-center flex-1 overflow-y-auto">
                    <video
                        ref={myVideoRef}
                        muted
                        autoPlay
                        playsInline
                        className="video w-full rounded-lg border-2 border-gray-300 shadow-md mb-4 max-h-[300px] object-cover"
                    />

                    <div className="remote-videos-container grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-4 overflow-auto max-h-[400px]">
                        {Object.entries(remoteStreams).map(([peerId, stream]) => (
                            <video
                                key={peerId}
                                autoPlay
                                playsInline
                                ref={(video) => {
                                    if (video) video.srcObject = stream;
                                }}
                                className="video w-full rounded-lg border-2 border-gray-300 shadow-md object-cover max-h-[200px]"
                            />
                        ))}
                    </div>

                    <div className="controls flex justify-around w-full max-w-md">
                        <button
                            onClick={toggleMic}
                            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md flex items-center gap-2"
                        >
                            {isMicMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
                            {isMicMuted ? 'Unmute' : 'Mute'}
                        </button>
                        <button
                            onClick={toggleCamera}
                            className="bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-md flex items-center gap-2"
                        >
                            {isCameraOff ? <FaVideoSlash /> : <FaVideo />}
                            {isCameraOff ? 'Camera On' : 'Camera Off'}
                        </button>
                        <button
                            onClick={leaveCall}
                            className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md flex items-center gap-2"
                        >
                            <FaPhoneSlash />
                            Leave
                        </button>
                    </div>
                </div>

                {/* Right: Code Editor */}
                <div className="flex-1 overflow-hidden rounded-lg shadow-lg bg-white">
                    <CodeEditor socket={socket} roomId={roomId} />
                </div>
            </div>
        </div>
    );

};

export default MeetingPage;
