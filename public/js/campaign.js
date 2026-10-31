export const CAMPAIGN = [
  { id: 1, title: 'Broken Boulevard', region: 'CITY', palette: 'city', summary: 'Escape the first wave through a shattered city street.', goal: 'Reach the blue-lit exit door.' },
  { id: 2, title: 'Subway Shadows', region: 'CITY', palette: 'city', summary: 'Cross the dead transit line while searchlights sweep the tracks.', goal: 'Reach the maintenance stairway.' },
  { id: 3, title: 'Rooftop Run', region: 'CITY', palette: 'city', summary: 'Climb fire escapes and cross rooftops above the patrols.', goal: 'Get across the rooftops.' },
  { id: 4, title: 'The Siren District', region: 'CITY', palette: 'city', summary: 'Move between shuttered shops and a robot dispatch tower.', goal: 'Slip past the dispatch tower.' },
  { id: 5, title: 'City Gate', region: 'CITY', palette: 'city', summary: 'Make one last push through the perimeter barricades.', goal: 'Reach the forest trail.' },
  { id: 6, title: 'Mosslight Trail', region: 'FOREST', palette: 'forest', summary: 'Leave the city behind beneath a roof of ancient trees.', goal: 'Follow the glowing trail markers.' },
  { id: 7, title: 'River of Sparks', region: 'FOREST', palette: 'forest', summary: 'Cross fast water, fallen logs, and exposed power cables.', goal: 'Cross the river gorge.' },
  { id: 8, title: 'Watcher Canopy', region: 'FOREST', palette: 'forest', summary: 'Avoid flying search drones threading through the branches.', goal: 'Get beyond the canopy scanners.' },
  { id: 9, title: 'The Old Ranger Station', region: 'FOREST', palette: 'forest', summary: 'Search an abandoned station for a hidden route out.', goal: 'Open the forest gate.' },
  { id: 10, title: 'Chainsaw Hollow', region: 'FOREST', palette: 'forest', summary: 'Climb and wall-jump through a tree maze ahead of a chainsaw hunter.', goal: 'Escape the falling tree and reach the service door.' },
  { id: 11, title: 'A Hundred Eyes', region: 'FACTORY', palette: 'factory', summary: 'Follow the forest into a covered building beneath a swarm, then enter the factory.', goal: 'Stay under the roof and cross the first assembly floor.' },
  { id: 12, title: 'Furnace Hall', region: 'FACTORY', palette: 'factory', summary: 'Time jumps around molten channels and crushing machinery.', goal: 'Cross the furnace hall.' },
  { id: 13, title: 'Prototype Wing', region: 'FACTORY', palette: 'factory', summary: 'Unfinished machines test strange movement patterns.', goal: 'Reach the prototype control door.' },
  { id: 14, title: 'The Control Foundry', region: 'FACTORY', palette: 'factory', summary: 'Reroute power and evade the last lines of defenders.', goal: 'Disable the production controls.' },
  { id: 15, title: 'Heart of Production', region: 'FACTORY', palette: 'factory', summary: 'Destroy the core production line and face the aftermath.', goal: 'Destroy the factory heart.' },
];

export function getLevel(id) {
  return CAMPAIGN.find((level) => level.id === Number(id)) ?? CAMPAIGN[0];
}

export function regionForLevel(id) {
  if (id <= 5) return 'city';
  if (id <= 10) return 'forest';
  return 'factory';
}

export const STORY_BEATS = {
  opening: {
    title: 'AI TAKE OVER',
    panels: [
      { heading: 'THE CITY FALLS', caption: 'The machines built to protect humanity have turned against it.', visual: 'invasion' },
      { heading: 'RUN!', caption: 'Tiny survivors race through the streets as the robot army closes in.', visual: 'chase' },
      { heading: 'STAY TOGETHER', caption: 'No one can win this alone. Find a way out.', visual: 'survivors' },
    ],
  },
  after5: {
    title: 'INTO THE TREES',
    panels: [
      { heading: 'THE CITY GATE', caption: 'The last barricade falls behind the survivors.', visual: 'gate' },
      { heading: 'THE HUNT CONTINUES', caption: 'Robots pour through the gate and chase people into the forest.', visual: 'forestChase' },
    ],
  },
  after10: {
    title: 'THE FALLEN HUNTER',
    panels: [
      { heading: 'TIMBER!', caption: 'The ancient tree crushes the chainsaw machine. Beyond it, a human-sized passage leads into the factory grounds.', visual: 'treeFall' },
    ],
  },
  after11: {
    title: 'THE COVERED WAY',
    panels: [
      { heading: 'A HUNDRED EYES ABOVE', caption: 'Only humans can pass beneath the low roof. Flying machines crowd the sky overhead.', visual: 'swarm' },
      { heading: 'BEHIND THE DOOR', caption: 'The survivors slip inside. A slow, mechanical rhythm echoes from beyond the wall.', visual: 'factoryDoor' },
      { heading: 'THEY ARE BEING MADE', caption: 'Robots assemble on conveyor belts. Behind the survivors, the pursuers enter the facility.', visual: 'assemblyReveal' },
    ],
  },
  after15: {
    title: 'AI TAKE OVER',
    panels: [
      { heading: 'WE DID IT', caption: 'The factory heart goes dark. For one breath, the survivors believe it is over.', visual: 'celebration' },
      { heading: 'NOT ALL OF THEM', caption: 'The robots attack the celebrating humans. The picture cuts sharply to black.', visual: 'darkTwist' },
    ],
  },
};
