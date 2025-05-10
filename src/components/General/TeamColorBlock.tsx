import React from "react";

interface TeamColors {
    primary: string;
    alternate: string;
}

const defaultColors: TeamColors = {
    primary: "888888",
    alternate: "FFFFFF",
};

export const TeamColorBlock: React.FC<{
    colors: TeamColors;
    leftToRight: boolean;
    reverse?: boolean;
    className?: string;
}> = ({ colors, leftToRight, reverse = false, className = "" }) => {
    try {
        const skew = leftToRight ? "-25deg" : "25deg";
        let primaryColor = colors?.primary || defaultColors.primary;
        let alternateColor = colors?.alternate || defaultColors.alternate;
        if (primaryColor == "ffffff") {
            primaryColor = alternateColor;
        } else if (alternateColor == "ffffff") {
            alternateColor = primaryColor;
        }
        const c1 = reverse ? primaryColor : alternateColor;
        const c2 = reverse ? alternateColor : primaryColor;

        return (
            <div className={`w-full h-full ${className} flex items-center justify-center gap-[2px]`}>
                <div
                className="w-[20%] h-full"
                style={{ 
                    backgroundColor: `#${c1}`,
                    transform: `skewX(${skew})`,
                }}
            />
            <div
                className="w-[20%] h-full"
                style={{ 
                    backgroundColor: `#${c2}`,
                    transform: `skewX(${skew})`,
                }}
            />
            </div>
        );
    } catch (error) {
        console.log(colors);
        console.error("Error in TeamColorBlock:", error);
        return <div className={`w-full h-full ${className}`}></div>;
    }
};