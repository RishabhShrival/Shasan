import { RESOURCE_TYPES, type DecisionCard, type QuestionTopic, type ResourceType, type Resources } from "../types";

/**
 * Reward shorthand: "c" Capitalism · "i" Idealism · "r" Conservatism (religion & tradition) · "s" Supremacy.
 * Example: "c2 i1 s1" → 2 Capitalism, 1 Idealism, 1 Supremacy. Every answer gives exactly 4 resources.
 * The dominant ideology is the largest reward (ties go to the first one written).
 */
const CODE: Record<string, ResourceType> = { c: "capitalism", i: "idealism", r: "conservatism", s: "supremacy" };

function parseRewards(code: string) {
  const rewards: Resources = { capitalism: 0, idealism: 0, conservatism: 0, supremacy: 0 };
  let dominant: ResourceType | undefined;
  for (const token of code.trim().split(/\s+/)) {
    const type = CODE[token[0]];
    const amount = Number(token.slice(1));
    if (!type || !Number.isInteger(amount) || amount < 1) throw new Error(`Invalid reward token "${token}".`);
    rewards[type] += amount;
    if (!dominant || rewards[type] > rewards[dominant]) dominant = type;
  }
  if (!dominant) throw new Error("Rewards cannot be empty.");
  return { rewards, dominant };
}

let counter = 0;
function q(topic: QuestionTopic, question: string, yes: string, no: string): DecisionCard {
  counter += 1;
  const yesRewards = parseRewards(yes);
  const noRewards = parseRewards(no);
  return {
    id: `q${String(counter).padStart(3, "0")}`,
    topic,
    question,
    yes: { label: "Yes", rewards: yesRewards.rewards, dominantResource: yesRewards.dominant },
    no: { label: "No", rewards: noRewards.rewards, dominantResource: noRewards.dominant },
  };
}

export const DECISION_CARDS: DecisionCard[] = [
  // ── Economy ──────────────────────────────────────────────────────────
  q("Economy", "Should the government sell its loss-making national airline to a private company?", "c3 s1", "i2 s2"),
  q("Economy", "Should income tax be cut for the middle class, even if money for welfare schemes goes down?", "c3 r1", "i3 s1"),
  q("Economy", "Should small local shops be protected from big online shopping companies with a special tax on those companies?", "r2 s1 i1", "c3 i1"),
  q("Economy", "Should all farmers get free electricity, even if the state goes into heavy debt?", "r2 i2", "c3 s1"),
  q("Economy", "Should foreign companies be allowed to fully own factories that make weapons for India?", "c3 i1", "s3 r1"),
  q("Economy", "Should all government offices be forced to buy only Indian-made products?", "s2 r2", "c3 i1"),
  q("Economy", "Should the richest 1% pay an extra wealth tax to fund government schools?", "i3 s1", "c3 r1"),
  q("Economy", "Should farm loans be waived just before the election?", "r2 i1 s1", "c3 i1"),

  // ── Education ────────────────────────────────────────────────────────
  q("Education", "Should religious scriptures be a compulsory subject in government schools?", "r3 s1", "i3 c1"),
  q("Education", "Should private schools be forced to give 25% of seats free to poor children?", "i3 s1", "c3 r1"),
  q("Education", "Should board exams be held only in Hindi and the state language, and not in English?", "s2 r2", "c2 i2"),
  q("Education", "Should coaching centres be banned for children below 16 years?", "i2 s2", "c3 r1"),
  q("Education", "Should universities be free to invite speakers who strongly criticise the government?", "i3 c1", "s3 r1"),
  q("Education", "Should the national anthem and a daily prayer be compulsory in every school assembly?", "s2 r2", "i3 c1"),
  q("Education", "Should foreign universities be allowed to open campuses in India and set their own fees?", "c3 i1", "s2 r2"),
  q("Education", "Should the state give free laptops to all Class 12 students instead of building new school toilets?", "s2 c2", "i3 r1"),

  // ── Healthcare ───────────────────────────────────────────────────────
  q("Healthcare", "Should all hospitals, including private ones, charge fixed government rates for surgeries?", "i2 s2", "c3 i1"),
  q("Healthcare", "Should Ayurveda and traditional medicine get the same government money as modern hospitals?", "r3 s1", "i2 c2"),
  q("Healthcare", "Should health insurance be compulsory for everyone, with the premium cut from salaries?", "s2 i2", "c2 r2"),
  q("Healthcare", "Should private companies be allowed to run district hospitals to improve service?", "c3 i1", "i2 s2"),
  q("Healthcare", "Should vaccination be compulsory, with fines for families who refuse?", "s3 i1", "r2 c2"),
  q("Healthcare", "Should medicine prices be controlled, even if some companies stop making those medicines?", "i3 s1", "c3 r1"),
  q("Healthcare", "Should doctors who studied in government colleges be forced to work 3 years in villages?", "s2 i2", "c3 i1"),
  q("Healthcare", "Should tobacco and gutkha be banned completely, even though many farmers grow tobacco?", "s2 i1 r1", "c2 r2"),

  // ── Agriculture ──────────────────────────────────────────────────────
  q("Agriculture", "Should the government stop buying wheat and rice at a fixed price (MSP) and let the market decide?", "c3 s1", "r2 i2"),
  q("Agriculture", "Should big companies be allowed to sign contract-farming deals with small farmers?", "c3 i1", "r3 i1"),
  q("Agriculture", "Should cow slaughter be banned across the whole country?", "r3 s1", "c2 i2"),
  q("Agriculture", "Should genetically modified (GM) seeds be allowed to increase crop yield?", "c2 i2", "r3 s1"),
  q("Agriculture", "Should farmers who burn crop stubble be fined heavily to reduce air pollution?", "s2 i2", "r3 c1"),
  q("Agriculture", "Should farm income above ₹50 lakh a year be taxed like any other income?", "i3 c1", "r2 s2"),
  q("Agriculture", "Should a huge dam be built to water farms, even if tribal villages must move?", "c2 s2", "r2 i2"),
  q("Agriculture", "Should free farm electricity be replaced with direct cash payments to farmers?", "c2 i2", "r3 s1"),

  // ── Infrastructure ───────────────────────────────────────────────────
  q("Infrastructure", "Should a bullet train be built, even if it costs as much as 10 years of village roads?", "s2 c2", "r2 i2"),
  q("Infrastructure", "Should private companies build highways and collect toll on them for 30 years?", "c3 s1", "i3 r1"),
  q("Infrastructure", "Should an old temple be shifted to make space for a new expressway?", "c2 s2", "r3 i1"),
  q("Infrastructure", "Should city slums be cleared and families moved to flats outside the city?", "s3 c1", "i3 r1"),
  q("Infrastructure", "Should all new government buildings follow traditional Indian architecture?", "r2 s2", "c3 i1"),
  q("Infrastructure", "Should the government quickly take farmland at low prices to build industrial corridors?", "s2 c2", "r2 i2"),
  q("Infrastructure", "Should metro and bus rides be free for all women?", "i3 r1", "c3 s1"),
  q("Infrastructure", "Should the capital be moved to a brand-new planned city to reduce crowding?", "s3 c1", "r2 i2"),

  // ── Governance ───────────────────────────────────────────────────────
  q("Governance", "Should the anti-corruption Lokpal be allowed to investigate the Prime Minister?", "i3 c1", "s3 r1"),
  q("Governance", "Should the central government be able to dismiss a state government during unrest?", "s3 r1", "i3 c1"),
  q("Governance", "Should government jobs be given only through written exams, with no interviews?", "i3 s1", "c2 r2"),
  q("Governance", "Should MLAs who switch parties be banned from elections for 6 years?", "i3 s1", "c3 r1"),
  q("Governance", "Should all elections in the country be held on the same day (One Nation, One Election)?", "s3 c1", "r2 i2"),
  q("Governance", "Should retired judges be banned from taking government posts for 5 years?", "i3 r1", "s2 c2"),
  q("Governance", "Should private consultants be hired to run ministries more efficiently?", "c3 s1", "r3 i1"),
  q("Governance", "Should village panchayats be allowed to make their own local rules on alcohol and marriage customs?", "r3 i1", "s3 i1"),

  // ── Society ──────────────────────────────────────────────────────────
  q("Society", "Should reservation in jobs be based on family income instead of caste?", "c3 i1", "r2 i2"),
  q("Society", "Should same-sex marriage be legally recognised?", "i3 c1", "r3 s1"),
  q("Society", "Should one Uniform Civil Code replace the separate personal laws of every religion?", "s3 i1", "r3 i1"),
  q("Society", "Should the legal marriage age for women be raised from 18 to 21?", "i2 s2", "r3 c1"),
  q("Society", "Should couples in live-in relationships have to register with the police?", "s2 r2", "i3 c1"),
  q("Society", "Should 33% of seats in Parliament be reserved for women starting this election?", "i3 s1", "r2 c2"),
  q("Society", "Should couples in inter-caste marriages get a ₹5 lakh government reward?", "i3 c1", "r3 s1"),
  q("Society", "Should begging be made a crime in big cities?", "s3 c1", "i3 r1"),

  // ── Religion & Culture ───────────────────────────────────────────────
  q("Religion & Culture", "Should the government take control of rich religious trusts and use their money for schools and hospitals?", "s2 i2", "r3 c1"),
  q("Religion & Culture", "Should loudspeakers at all religious places be banned after 10 pm?", "i2 s1 c1", "r3 s1"),
  q("Religion & Culture", "Should films that 'hurt religious feelings' be banned before release?", "r3 s1", "i2 c2"),
  q("Religion & Culture", "Should anyone changing their religion need permission from the district magistrate?", "s2 r2", "i3 c1"),
  q("Religion & Culture", "Should a new national holiday be declared for a major festival, even if it costs the economy ₹5,000 crore?", "r3 s1", "c3 i1"),
  q("Religion & Culture", "Should the state pay for pilgrimages of people from all religions?", "r3 i1", "c2 i2"),
  q("Religion & Culture", "Should city names from the time of foreign rulers be changed back to older Indian names?", "s2 r2", "i2 c2"),
  q("Religion & Culture", "Should meat shops near temples be closed during festivals?", "r3 s1", "c3 i1"),
  q("Religion & Culture", "Should religious leaders be allowed to tell their followers which party to vote for?", "r3 c1", "i3 s1"),

  // ── Environment ──────────────────────────────────────────────────────
  q("Environment", "Should a coal mine be opened inside a forest if it creates 20,000 jobs?", "c3 s1", "i3 r1"),
  q("Environment", "Should petrol and diesel cars be banned in cities from 2035?", "i2 s2", "c3 r1"),
  q("Environment", "Should idol immersion and cremation be banned on the banks of a holy river to clean it?", "i2 s2", "r3 c1"),
  q("Environment", "Should polluting factories be allowed to pay a fine and keep running while they upgrade?", "c3 i1", "i3 s1"),
  q("Environment", "Should plastic bags be banned completely, even for small shopkeepers?", "s2 i2", "c3 r1"),
  q("Environment", "Should firecrackers be banned during festivals to reduce pollution?", "i3 s1", "r3 c1"),
  q("Environment", "Should the government plant forests on common village grazing land?", "i2 s1 c1", "r3 c1"),
  q("Environment", "Should new big dams in the Himalayas be stopped after repeated flood disasters?", "i3 r1", "c2 s2"),

  // ── Technology ───────────────────────────────────────────────────────
  q("Technology", "Should the government be able to read private chat messages to stop fake news?", "s3 r1", "i3 c1"),
  q("Technology", "Should a national ID be needed to open any social media account?", "s3 c1", "i3 c1"),
  q("Technology", "Should foreign apps that store Indian users' data abroad be banned?", "s3 r1", "c3 i1"),
  q("Technology", "Should AI decide who gets welfare benefits, to reduce corruption?", "c2 s2", "i3 r1"),
  q("Technology", "Should online games with real-money betting be banned?", "r2 s2", "c3 i1"),
  q("Technology", "Should the internet be shut down in a district during riots?", "s3 r1", "i3 c1"),
  q("Technology", "Should government services be offered only through a mobile app, closing offline counters?", "c3 s1", "r2 i2"),
  q("Technology", "Should cryptocurrency be legal and taxed like shares?", "c3 i1", "s3 r1"),

  // ── National Security ────────────────────────────────────────────────
  q("National Security", "Should defence spending be doubled, even if the health budget is cut?", "s3 c1", "i3 r1"),
  q("National Security", "Should one year of military service be compulsory for all young people?", "s3 r1", "i2 c2"),
  q("National Security", "Should the government hold peace talks with a hostile neighbour while attacks continue?", "i3 c1", "s3 r1"),
  q("National Security", "Should police be allowed to arrest without a warrant in terror cases?", "s3 r1", "i3 c1"),
  q("National Security", "Should refugees from neighbouring countries be allowed to settle in India?", "i3 r1", "s3 c1"),
  q("National Security", "Should private Indian companies be allowed to export weapons abroad?", "c3 s1", "r2 i2"),
  q("National Security", "Should the army be sent onto the streets to control violent protests?", "s3 r1", "i3 c1"),

  // ── Media ────────────────────────────────────────────────────────────
  q("Media", "Should TV news channels be heavily fined for showing fake news?", "s2 i2", "c3 i1"),
  q("Media", "Should the government stop giving ads to newspapers that criticise it?", "s3 c1", "i3 c1"),
  q("Media", "Should one business group be allowed to own more than 5 TV news channels?", "c3 s1", "i3 r1"),
  q("Media", "Should web series be checked by a censor board before release, like films?", "r2 s2", "i2 c2"),
  q("Media", "Should journalists be protected from arrest while they are reporting?", "i3 c1", "s3 r1"),
  q("Media", "Should the state TV channel show more religious and cultural programmes?", "r3 s1", "c2 i2"),
  q("Media", "Should social media influencers be paid by the government to promote its schemes?", "s2 c2", "i3 r1"),

  // ── Elections ────────────────────────────────────────────────────────
  q("Elections", "Should voting be compulsory, with a small fine for not voting?", "s2 i2", "c2 r2"),
  q("Elections", "Should the government fund all election campaigns and ban private donations to parties?", "i3 s1", "c3 r1"),
  q("Elections", "Should candidates with pending criminal cases be banned from elections?", "i3 s1", "r2 c2"),
  q("Elections", "Should parties be banned from promising freebies in their manifestos?", "c2 i2", "r2 i2"),
  q("Elections", "Should people be allowed to vote online from their mobile phones?", "c2 i2", "r2 s2"),
  q("Elections", "Should a minimum education qualification be needed to contest elections?", "s2 c1 i1", "i3 r1"),
];

/** Sanity helper used by tests. */
export function totalRewards(resources: Resources) {
  return RESOURCE_TYPES.reduce((sum, type) => sum + resources[type], 0);
}
