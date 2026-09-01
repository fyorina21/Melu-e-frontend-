export interface AbllsItemDef {
  id: string;
  description: string;
  maxCells?: number;
  options?: string[];
}

export interface AbllsDomainDef {
  code: string;
  name: string;
  items: AbllsItemDef[];
}

export const DEFAULT_ABLLS_DOMAINS: AbllsDomainDef[] = [
  {
    code: 'A',
    name: 'Visual Performance',
    items: [
      { id: 'A1', description: 'Matches identical objects' },
      { id: 'A2', description: 'Matches identical pictures to objects' },
      { id: 'A3', description: 'Matches non-identical pictures' },
      { id: 'A4', description: 'Sorts by color and shape' },
      { id: 'A5', description: 'Completes simple puzzle (4 pieces)' },
      { id: 'A6', description: 'Matches shapes (circle, square, triangle)' },
      { id: 'A7', description: 'Selects named object from array of 3' },
    ],
  },
  {
    code: 'B',
    name: 'Motor Imitation',
    items: [
      { id: 'B1', description: 'Gross motor imitation' },
      { id: 'B2', description: 'Fine motor imitation' },
      { id: 'B3', description: 'Imitation with objects' },
      { id: 'B4', description: 'Sequential imitation' },
    ],
  },
  {
    code: 'C',
    name: 'Vocal Imitation',
    items: [
      { id: 'C1', description: 'Imitation of vowel sounds' },
      { id: 'C2', description: 'Imitation of consonant sounds' },
      { id: 'C3', description: 'Imitation of words' },
      { id: 'C4', description: 'Imitation of phrases' },
      { id: 'C5', description: 'Imitation of pitch and tone' },
      { id: 'C6', description: 'Imitation of volume' },
      { id: 'C7', description: 'Imitation of multi-syllables' },
    ],
  },
  {
    code: 'D',
    name: 'Receptive Language',
    items: [
      { id: 'D1', description: 'Responds to own name' },
      { id: 'D2', description: 'Follows simple commands' },
      { id: 'D3', description: 'Identifies body parts' },
      { id: 'D4', description: 'Answers yes/no questions' },
      { id: 'D5', description: 'Identifies common objects' },
      { id: 'D6', description: 'Identifies familiar people' },
      { id: 'D7', description: 'Follows 2-step instructions' },
      { id: 'D8', description: 'Selects item by function/feature' },
    ],
  },
  {
    code: 'E',
    name: 'Requesting (Mands)',
    items: [
      { id: 'E1', description: 'Requests preferred item' },
      { id: 'E2', description: 'Requests missing item' },
      { id: 'E3', description: 'Requests help' },
      { id: 'E4', description: 'Requests information' },
      { id: 'E5', description: 'Requests attention from peers' },
      { id: 'E6', description: 'Requests removal of aversive item' },
    ],
  },
  {
    code: 'F',
    name: 'Play and Leisure',
    items: [
      { id: 'F1', description: 'Plays independently' },
      { id: 'F2', description: 'Engages in parallel play' },
      { id: 'F3', description: 'Turns taking with peers' },
      { id: 'F4', description: 'Initiates play with peers' },
      { id: 'F5', description: 'Cooperative toy/board games' },
      { id: 'F6', description: 'Pretend / symbolic play' },
    ],
  },
  {
    code: 'G',
    name: 'Social Interaction',
    items: [
      { id: 'G1', description: 'Responds to greetings' },
      { id: 'G2', description: 'Initiates greetings' },
      { id: 'G3', description: 'Shares attention' },
      { id: 'G4', description: 'Engages in group activities' },
      { id: 'G5', description: 'Maintains eye contact' },
      { id: 'G6', description: 'Recognizes facial expressions' },
      { id: 'G7', description: 'Shares items with peers' },
    ],
  },
  {
    code: 'H',
    name: 'Writing',
    items: [
      { id: 'H1', description: 'Holds writing tool' },
      { id: 'H2', description: 'Draws linear marks' },
      { id: 'H3', description: 'Traces shapes & letters' },
      { id: 'H4', description: 'Copies letters & numbers' },
      { id: 'H5', description: 'Writes own name' },
      { id: 'H6', description: 'Prints words from dictation' },
    ],
  },
  {
    code: 'I',
    name: 'Dressing',
    items: [
      { id: 'I1', description: 'Pulls off shoes and socks' },
      { id: 'I2', description: 'Pulls up pants' },
      { id: 'I3', description: 'Puts on shirt / jacket' },
      { id: 'I4', description: 'Operates zipper' },
      { id: 'I5', description: 'Buttons large buttons' },
      { id: 'I6', description: 'Snaps fasteners' },
      { id: 'I7', description: 'Ties or fastens footwear' },
    ],
  },
];

export function buildAbllsDomainsFromConfig(
  fields?: Array<{ id: string; label: string; visible?: boolean; section?: string; options?: string[] }>
): AbllsDomainDef[] {
  if (!fields || !Array.isArray(fields) || fields.length === 0) {
    return DEFAULT_ABLLS_DOMAINS;
  }

  // Filter out visible === false
  const visible = fields.filter((f) => f.visible !== false);

  const domainMap = new Map<string, AbllsItemDef[]>();
  DEFAULT_ABLLS_DOMAINS.forEach((d) => domainMap.set(d.name, []));

  visible.forEach((f) => {
    let domainName = f.section;
    if (!domainName || domainName === 'General') {
      const match = DEFAULT_ABLLS_DOMAINS.find(
        (d) =>
          f.label.toLowerCase().includes(d.name.toLowerCase()) ||
          f.id.toUpperCase().startsWith(d.code) ||
          f.label.toUpperCase().startsWith(d.code)
      );
      if (match) domainName = match.name;
    }

    if (domainName && domainMap.has(domainName)) {
      const parts = f.label.split(':');
      const description = parts.length > 1 ? parts.slice(1).join(':').trim() : f.label;
      const itemId = parts.length > 1 && parts[0].trim().length <= 4 ? parts[0].trim() : f.id;
      domainMap.get(domainName)!.push({
        id: itemId,
        description,
        options: f.options,
      });
    }
  });

  return DEFAULT_ABLLS_DOMAINS.map((d) => {
    const list = domainMap.get(d.name);
    return {
      code: d.code,
      name: d.name,
      items: list && list.length > 0 ? list : (DEFAULT_ABLLS_DOMAINS.find((def) => def.code === d.code)?.items ?? []),
    };
  });
}
