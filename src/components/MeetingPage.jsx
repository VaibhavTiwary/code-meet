import React, { useState, useEffect, useRef } from 'react';
import '../styles.css';
import { useParams } from 'react-router-dom';
import Peer from 'peerjs';
import { useNavigate } from 'react-router-dom';


const MeetingPage = () => {
    const { roomId } = useParams();
    const [peer, setPeer] = useState(null);
    const [myStream, setMyStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [connected, setConnected] = useState(false);
    const [isMicMuted, setIsMicMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [currentCall, setCurrentCall] = useState(null);
    const [message, setMessage] = useState('');


    const myVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    const navigate = useNavigate();


    // Initialize Peer and Media Stream
    useEffect(() => {
        const newPeer = new Peer(roomId);
        setPeer(newPeer);

        navigator.mediaDevices.getUserMedia({ video: true, audio: true }) //request access to users camera and microphone
            .then(stream => {
                setMyStream(stream);
                if (myVideoRef.current) {
                    myVideoRef.current.srcObject = stream;   //show the video on screen
                }

                newPeer.on('call', (call) => {
                    call.answer(stream);    //if someone else tries to connect then we answer them by sending our media stream to them
                    call.on('stream', (remoteStream) => {  //storing other persons stram in remoteStream
                        setRemoteStream(remoteStream);
                        setConnected(true);
                    });
                    setCurrentCall(call);
                });
            })
            .catch(error => console.error('Error accessing media devices:', error));

        return () => {
            newPeer.destroy();
        };
    }, [roomId]);

    // Update video src when stream updates
    // myVideoRef - It's a reference to the <video> HTML element that is used to display your own camera feed.
    // This tells the browser to show this video stream inside this video element.
    useEffect(() => {
        if (myVideoRef.current && myStream) {
            myVideoRef.current.srcObject = myStream;
        }
    }, [myStream]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    // Start a new call
    const startCall = (peerId) => {
        const call = peer.call(peerId, myStream);
        call.on('stream', (stream) => {
            setRemoteStream(stream);
            setConnected(true);
        });
        setCurrentCall(call);
    };

    // Toggle mic
    const toggleMic = () => {
        if (myStream) {
            myStream.getAudioTracks().forEach(track => {
                track.enabled = !isMicMuted;
            });
            setIsMicMuted(!isMicMuted);
        }
    };

    // Toggle camera
    const toggleCamera = () => {
        if (myStream) {
            const videoTrack = myStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsCameraOff(!videoTrack.enabled);
            }
        }
    };

    // Leave call
    // Leave call and clean up
    const leaveCall = () => {
        if (currentCall) {
            currentCall.close();
            setCurrentCall(null);
        }

        if (myStream) {
            myStream.getTracks().forEach(track => track.stop());
            setMyStream(null);
        }

        if (myVideoRef.current) {
            myVideoRef.current.srcObject = null;
        }

        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
        }

        setRemoteStream(null);
        setConnected(false);

        setMessage('You left the meeting successfully 😊');


        setTimeout(() => {
            navigate('/');
        }, 2000);
    };


    return (
        <div className="meeting-container">
            <h2 className="text-xl font-semibold text-center mb-4">Room: {roomId}</h2>

            {message && (
                <div className="text-green-600 text-center mb-4 font-medium">
                    {message}
                </div>
            )}

            {/* Conditionally shows remote video only when remoteStream is set. */}
            <div className="video-container flex justify-center items-center gap-4 mb-6">
                <video ref={myVideoRef} muted autoPlay playsInline className="video w-1/3 rounded-lg border-2 border-gray-300"></video>
                {remoteStream && (
                    <video ref={remoteVideoRef} autoPlay playsInline className="video w-1/3 rounded-lg border-2 border-gray-300"></video>
                )}
            </div>

            {!connected && (
                <button
                    onClick={() => startCall('peer-id-to-connect-to')}
                    className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-400"
                >
                    Join Call
                </button>
            )}

            <div className="controls flex justify-around mt-4">
                <button
                    onClick={toggleMic}
                    className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-400"
                >
                    {isMicMuted ? 'Unmute' : 'Mute'}
                </button>
                <button
                    onClick={toggleCamera}
                    className="bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-400"
                >
                    {isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
                </button>
                <button
                    onClick={leaveCall}
                    className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-400"
                >
                    Leave
                </button>
            </div>
        </div>
    );
};

export default MeetingPage;
