import type { DecisionCard, Resources } from "../types";

function rewards(capitalism: number, communism: number, socialism: number, fascism: number): Resources {
  return { capitalism, communism, socialism, fascism };
}

function decision(
  id: string,
  title: string,
  scenario: string,
  yes: Resources,
  no: Resources,
  yesDominant: DecisionCard["yes"]["dominantResource"],
  noDominant: DecisionCard["no"]["dominantResource"],
): DecisionCard {
  return {
    id,
    title,
    scenario,
    yes: { label: "Yes", rewards: yes, dominantResource: yesDominant },
    no: { label: "No", rewards: no, dominantResource: noDominant },
  };
}

export const DECISION_CARDS: DecisionCard[] = [
  decision("education-charter", "The School Charter", "Should the Union fund a universal public-school guarantee, even if it delays new industrial grants?", rewards(0, 2, 2, 0), rewards(3, 0, 1, 0), "communism", "capitalism"),
  decision("farm-price", "The Harvest Price", "Should the government guarantee a minimum purchase price for staple crops during a difficult monsoon season?", rewards(0, 1, 3, 0), rewards(3, 0, 1, 0), "socialism", "capitalism"),
  decision("city-corridor", "The City Corridor", "Should a fast-track transit corridor proceed through dense neighbourhoods with limited consultation?", rewards(2, 0, 0, 2), rewards(1, 0, 3, 0), "capitalism", "socialism"),
  decision("health-network", "The Health Network", "Should a national public-health network receive emergency funding by reducing tax concessions for large firms?", rewards(0, 2, 2, 0), rewards(3, 0, 1, 0), "communism", "capitalism"),
  decision("data-rights", "The Data Rights Bill", "Should citizens be able to require social platforms to delete and export their personal data?", rewards(0, 0, 3, 1), rewards(3, 0, 0, 1), "socialism", "capitalism"),
  decision("river-protection", "The River Protection Order", "Should a polluting factory cluster be paused while an independent river assessment is completed?", rewards(0, 0, 3, 1), rewards(3, 0, 1, 0), "socialism", "capitalism"),
  decision("housing-lease", "The Housing Lease", "Should vacant public land be leased for low-cost housing with long-term rent controls?", rewards(0, 2, 2, 0), rewards(3, 0, 1, 0), "communism", "capitalism"),
  decision("disaster-command", "The Disaster Command", "Should the cabinet temporarily centralize relief distribution after a major cyclone?", rewards(0, 1, 1, 2), rewards(0, 1, 3, 0), "fascism", "socialism"),
  decision("public-protest", "The March on the Capital", "Should a week-long peaceful protest receive an unrestricted permit near Parliament?", rewards(0, 0, 3, 1), rewards(0, 0, 1, 3), "socialism", "fascism"),
  decision("work-guarantee", "The Work Guarantee", "Should the state expand a rural employment guarantee during a period of high youth unemployment?", rewards(0, 2, 2, 0), rewards(3, 0, 1, 0), "communism", "capitalism"),
  decision("media-disclosure", "The Media Disclosure Rule", "Should political advertising be required to display its funding source and targeting criteria?", rewards(0, 0, 3, 1), rewards(3, 0, 0, 1), "socialism", "capitalism"),
  decision("heritage-quarter", "The Heritage Quarter", "Should a historic market district be protected from redevelopment despite a projected loss in tax revenue?", rewards(0, 0, 3, 1), rewards(3, 0, 1, 0), "socialism", "capitalism"),
  decision("university-autonomy", "The University Charter", "Should public universities retain independent admissions and curriculum boards?", rewards(0, 0, 3, 1), rewards(0, 1, 1, 2), "socialism", "fascism"),
  decision("reservoir-plan", "The Reservoir Plan", "Should a drought reservoir be approved despite requiring relocation packages for several villages?", rewards(2, 0, 1, 1), rewards(0, 1, 3, 0), "capitalism", "socialism"),
  decision("audit-commission", "The Audit Commission", "Should an independent commission investigate alleged procurement irregularities involving a fictional state contractor?", rewards(0, 0, 3, 1), rewards(0, 1, 1, 2), "socialism", "fascism"),
  decision("language-services", "The Language Services Act", "Should all major public-service forms be provided in regional languages as well as the national language?", rewards(0, 1, 3, 0), rewards(2, 0, 1, 1), "socialism", "capitalism"),
  decision("night-safety", "The Night Safety Plan", "Should late-night transit receive more patrols and surveillance funding?", rewards(0, 0, 1, 3), rewards(0, 0, 3, 1), "fascism", "socialism"),
  decision("small-business", "The Small Business Credit Line", "Should micro-businesses receive subsidized credit funded by a levy on major corporations?", rewards(0, 2, 2, 0), rewards(3, 0, 1, 0), "communism", "capitalism"),
  decision("coastal-fishing", "The Coastal Fishing Zone", "Should industrial trawling be restricted to protect small fishing communities and breeding grounds?", rewards(0, 1, 3, 0), rewards(3, 0, 1, 0), "socialism", "capitalism"),
  decision("emergency-broadcast", "The Emergency Broadcast Code", "Should government emergency broadcasts be mandatory across private channels during a security crisis?", rewards(0, 1, 1, 2), rewards(0, 0, 3, 1), "fascism", "socialism"),
];
