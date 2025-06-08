import { useState } from "react";

type Props = {
    agentName: string;
    onClick: () => void;
};

const AgentImage: React.FC<Props> = ({ agentName, onClick }) => {
    const [clicked, setClicked] = useState(false);

    const handleClick = () => {
        if (clicked) return;
        onClick();
        console.log(`Clicked on ${agentName}`);
        setClicked(true);
    };

    return (
        <div
            onClick={handleClick}
            className={`relative inline-block w-[40px] h-[30px] ${clicked ? 'pointer-events-none' : ''}`}
        >
            <img
                src={`Images/Agents/${agentName}.png`}
                alt={agentName}
                className="w-[40px] h-[30px] object-cover"
            />
            {clicked && (
                <div className="absolute inset-0 bg-red-500 opacity-50 pointer-events-none" />
            )}
        </div>
    );
};

export default AgentImage;