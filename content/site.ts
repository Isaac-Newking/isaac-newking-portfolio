// Site copy. These move into the Sanity dashboard so they can be edited without code.

export const SITE = {
  name: 'Isaac Newking',
  title: 'Brand Designer',
  email: 'newkingisaac@outlook.com',
  years: 6,
  bio: "I'm a brand designer. For six years I've built identities that hold up everywhere they land: a token launch on X, a trading app, a billboard, a box on a shelf. I work across branding, motion and interface design for crypto founders, agencies and local businesses, so the logo, the launch film and the product screen all read as one brand.",
  experience: 'Brand identity, campaigns, motion and product interfaces, from Web3 launches to home and lifestyle brands.',
  roles: ['Motion Designer', 'Brand Designer', 'Graphics Design', 'UI/UX', 'Visual Identity', 'Logo'],
  skills: ['Branding', 'Logo Design', 'Motion Design', 'Video Editing', 'Illustration', 'Visual Identity'],
  software: [
    ['Ae', 'After Effects'], ['Ps', 'Photoshop'], ['Ai', 'Illustrator'], ['Id', 'InDesign'],
    ['Fg', 'Figma'], ['Cd', 'CorelDRAW'], ['Dv', 'DaVinci Resolve'],
  ] as [string, string][],
  services: ['Brand Identity', 'Logo Design', 'Motion Design', 'UI/UX Design', 'Visual Identity', 'Social & Launch Graphics', 'Illustration'],
  socials: [] as { label: string; href: string }[],
  bookingUrl: '',
};

export const FAQ: [string, string][] = [
  ['What do you design?', 'Brand identities, logos, motion graphics, UI/UX for websites and apps, and social, launch and print graphics.'],
  ['How long does a project take?', "It depends on the scope. Send a short brief and I'll reply with a timeline before we start."],
  ['Do you work remotely?', 'Yes. I work with clients in any time zone.'],
  ['What do I get at the end?', 'Final files ready for every platform you need, plus source files. Identity projects also get simple brand guidelines.'],
  ['How do we start?', `Email ${SITE.email} with what you need, your timeline and any references.`],
];

// Empty on purpose: the section stays hidden until the first testimonial is added.
export const TESTIMONIALS: { quote: string; name: string; role: string }[] = [];

// Esorae Home motion pieces. Add files to /public/motion and list them here.
export const MOTION: { src: string; poster?: string; title: string; w: number; h: number }[] = [
  { src: '/motion/esorae-diffuser.mp4', poster: '/motion/esorae-diffuser.jpg', title: 'Fragrance collections reel: Stoneglow, Jambo, Cereria Molla', w: 1600, h: 770 },
  { src: '/motion/esorae-pillows.mp4', poster: '/motion/esorae-pillows.jpg', title: 'Pillow range reel: Five Star, Memory Foam, Baby Pillow, Bounce Back', w: 1600, h: 770 },
];
