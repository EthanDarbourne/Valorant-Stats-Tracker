import { Team } from "../../shared/TeamSchema";


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

export function zipArrays<T, U>(arr1: T[], arr2: U[]): [T, U][] {
  // Use .map() on the first array to iterate through indices
  return arr1.map((element, index) => {
    // Return a tuple containing the element from each array at the same index
    return [element, arr2[index]];
  });
}

export function getTeamNamesByTeamId(teamIds: (number | null | undefined)[], teams: Team[]) {
    return teamIds.map(x => teams.find(y => y.Id == x)?.Name ?? "");
}