# lines taken from https://liquipedia.net/valorant/VCT/2024/Partnered_Teams

lines = """EDward Gaming
China
10 points

Xi Lai Gaming
China
9 points

Bilibili Gaming
China
8 points

Trace Esports
China
5 points

Wolves Esports
China
5 points

Dragon Ranger Gaming
China
3 points

Titan Esports Club
China
3 points

Nova Esports
China
3 points

FunPlus Phoenix
China
2 points

JDG Esports
China
1 points

TYLOO
China
1 points

All Gamers"""

region = "CN"
vals = sorted(lines.split('\n')[::4])

print("INSERT INTO \"Teams\" (\"Name\", \"Region\") VALUES ", end="")
print(", ".join([f"('{val}', '{region}')" for val in vals]))