

export const PORT = 5000;

export enum Regions {
    AMER = "AMER",
    EMEA = "EMEA",
    APAC = "APAC",
    CN = "CN"
}

export enum TournamentTypes {
    StageWithinGroup = "StageWithinGroup",
    StageOutOfGroup = "StageOutOfGroup",
    SwissIntoDoubleElim = "SwissIntoDoubleElim",
    DoubleElim = "DoubleElim",
    SingleElim = "SingleElim",
}

export const RegionList = Object.values(Regions);
export const TournamentTypeList = Object.values(TournamentTypes);

export const roles = ['Duelist', 'Initiator', 'Smokes', 'Senti', 'Flex'];
