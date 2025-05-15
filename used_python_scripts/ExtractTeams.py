# lines taken from https://liquipedia.net/valorant/VCT/2024/Partnered_Teams

lines = """Japan Tokyo	DetonatioN FocusMe DetonatioN FocusMe	DetonatioN, Inc.	Partner	2023	-
South Korea Seoul	DRX DRX	DRX Corp.	Partner	2023	-
South Korea Seoul	Gen.G Esports Gen.G Esports	KSV eSports Korea, Inc.	Partner	2023	-
India Mumbai	Global Esports Global Esports	Global Esports	Partner	2023	-
Singapore Singapore	Paper Rex Paper Rex	IMPLS Entertainment Pte Ltd.	Partner	2023	-
Indonesia Jakarta	Rex Regum Qeon Rex Regum Qeon	PT. Qeon Interactive	Partner	2023	-
South Korea Seoul	T1 T1	SK Telecom CS T1 Co., Ltd.	Partner	2023	-
Hong Kong Hong Kong	TALON TALON	Talon Esports Ltd.	Partner	2023	-
Philippines Quezon City	Team Secret Team Secret	Secret Esports, LLC.	Partner	2023	-
Japan Tokyo	ZETA DIVISION ZETA DIVISION	GANYMEDE, Inc.	Partner	2023	-
Singapore Singapore	Bleed Esports Bleed Esports	Bleed Esports	Ascended	2024	2024"""

vals = [line.split("\t")[1] for line in lines.split('\n')]
print([val[:len(val) // 2] for val in vals])