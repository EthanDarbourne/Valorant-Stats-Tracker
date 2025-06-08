

type ButtonStyleOptions = {
    bg?: string;
    text?: string;
    hoverBg?: string;
    padding?: string;
    rounded?: boolean;
    border?: boolean;
    transition?: boolean;
};

export function getButtonClass({
    bg = "bg-blue-600",
    text = "text-white",
    hoverBg = "hover:bg-blue-700",
    padding = "px-4 py-2",
    rounded = true,
    border = false,
    transition = false,
}: ButtonStyleOptions): string {
    return [
        "whitespace-nowrap",
        bg,
        text,
        "hover:" + hoverBg,
        padding,
        rounded ? "rounded" : "",
        border ? "border border-gray-300" : "",
        transition ? "transition" : "",
    ]
        .filter(Boolean)
        .join(" ");
}


