import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

const Home = () => {
    const [roomLink, setRoomLink] = useState('');
    const navigate = useNavigate();

    const handleCreateMeeting = () => {
        const newRoomId = uuidv4();
        navigate(`/meeting/${newRoomId}`);
    };

    const handleJoinMeeting = () => {
        if (roomLink.trim()) {
            const roomId = roomLink.split('/').pop(); // extract ID
            navigate(`/meeting/${roomId}`);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white gap-6">
            <h1 className="text-4xl font-bold">CodeMeet</h1>
            <p className="text-gray-400">Collaborate with code & video in real-time</p>

            <div className="flex flex-col gap-4 w-full max-w-md">
                <button onClick={handleCreateMeeting} className="bg-blue-600 hover:bg-blue-700 py-2 rounded-lg text-xl">
                    + New Meeting
                </button>

                <input
                    type="text"
                    placeholder="Paste your meeting link here..."
                    className="p-2 rounded text-black"
                    value={roomLink}
                    onChange={(e) => setRoomLink(e.target.value)}
                />
                <button onClick={handleJoinMeeting} className="bg-green-600 hover:bg-green-700 py-2 rounded-lg text-xl">
                    Join Meeting
                </button>
            </div>
        </div>
    );
};

export default Home;
