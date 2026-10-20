import { PrismaClient, type DeliveryMethod, type OrderStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { passwordSchema } from "@/lib/validators";
import { checkSeedSafety } from "./seed-guard";

const db = new PrismaClient();

/* ----------------------------------------------------------------------------
 * Deterministic randomness so every seed produces the same store.
 * ------------------------------------------------------------------------- */
let state = 20241019;
function rand() {
  state = (state * 1664525 + 1013904223) % 4294967296;
  return state / 4294967296;
}
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];
const between = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;

const img = (id: string, zoom?: { x: number; y: number; z: number }) => {
  const base = `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&h=1500&q=80`;
  return zoom ? `${base}&crop=focalpoint&fp-x=${zoom.x}&fp-y=${zoom.y}&fp-z=${zoom.z}` : base;
};
const wide = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&h=1200&q=80`;

/* ----------------------------------------------------------------------------
 * Catalogue
 * ------------------------------------------------------------------------- */
const categories = [
  {
    slug: "apparel",
    name: "Apparel",
    description: "Wardrobe foundations cut from heavyweight cottons, Japanese denim and vegetable-tanned leather.",
    image: wide("1512436991641-6745cdb1723f"),
  },
  {
    slug: "footwear",
    name: "Footwear",
    description: "Goodyear-welted classics and city runners made to be resoled, not replaced.",
    image: wide("1525966222134-fcfa99b8ae77"),
  },
  {
    slug: "bags",
    name: "Bags & Leather",
    description: "Carry-alls, crossbodies and small leather goods that soften with every year.",
    image: wide("1600857062241-98e5dba7f214"),
  },
  {
    slug: "accessories",
    name: "Accessories",
    description: "Timepieces, recycled-gold jewelry and eyewear — the finishing details.",
    image: wide("1524805444758-089113d48a6d"),
  },
  {
    slug: "sound-tech",
    name: "Sound & Tech",
    description: "Quiet technology: tuned audio, honest materials, no unnecessary lights.",
    image: wide("1618366712010-f4ae9c647dcb"),
  },
  {
    slug: "home-apothecary",
    name: "Home & Apothecary",
    description: "Small-batch candles and botanical body care for slower evenings.",
    image: wide("1603006905003-be475563bc59"),
  },
] as const;

type CategorySlug = (typeof categories)[number]["slug"];
type Color = { name: string; hex: string; image: string; detail?: { x: number; y: number; z: number } };
type SeedProduct = {
  name: string;
  category: CategorySlug;
  price: number;
  compareAt?: number;
  tagline: string;
  description: string;
  specs: [string, string][];
  colors: Color[];
  sizes?: string[];
  featured?: boolean;
  /** Override stock rules: "soldout" sets all variants to 0, "low" keeps stock under 5 */
  stock?: "soldout" | "low";
  daysAgo: number;
};

const apparelSizes = ["XS", "S", "M", "L", "XL"];
const shoeSizes = ["40", "41", "42", "43", "44", "45"];

const products: SeedProduct[] = [
  // Apparel
  {
    name: "Field Bomber",
    category: "apparel",
    price: 28500,
    tagline: "A water-resistant bomber in brushed cotton twill.",
    description:
      "Our take on the 1950s flight jacket, cut a touch longer and softened for the city. The shell is a dense, brushed cotton twill with a wax-free water-repellent finish; the lining is recycled cupro, so it slides on over knitwear without catching. Rib trims are knit in Portugal from merino-blend yarn that keeps its shape wash after wash.",
    specs: [["Shell", "100% organic cotton twill, 310gsm"], ["Lining", "Recycled cupro"], ["Fit", "Relaxed, hip length"], ["Origin", "Made in Portugal"], ["Care", "Cold wash, line dry"]],
    colors: [{ name: "Rust", hex: "#a4532f", image: "1591047139829-d91aecb6caea", detail: { x: 0.5, y: 0.35, z: 2 } }],
    sizes: apparelSizes,
    featured: true,
    daysAgo: 6,
  },
  {
    name: "Atelier Moto Jacket",
    category: "apparel",
    price: 59500,
    compareAt: 69500,
    tagline: "Vegetable-tanned lambskin, built to age beautifully.",
    description:
      "A sharp, asymmetric moto cut from supple lambskin tanned with tree bark rather than chrome. It arrives with a soft hand and gains a deep patina over time. Hardware is solid brass with a blackened finish, and every seam is double-stitched for decades of wear.",
    specs: [["Leather", "Vegetable-tanned lambskin, 0.9mm"], ["Hardware", "Blackened solid brass"], ["Lining", "Viscose twill"], ["Fit", "Close, cropped at the waist"], ["Origin", "Made in Italy"]],
    colors: [{ name: "Black", hex: "#141414", image: "1551028719-00167b16eac5", detail: { x: 0.45, y: 0.4, z: 2.2 } }],
    sizes: apparelSizes,
    featured: true,
    daysAgo: 40,
  },
  {
    name: "Everyday Heavyweight Tee",
    category: "apparel",
    price: 4800,
    tagline: "The tee we wear four days a week.",
    description:
      "Knit from long-staple Supima cotton on vintage loopwheel machines, this tee has a dense, dry hand and a collar that refuses to bacon. Pre-washed and garment-dyed so it fits exactly the same after the first wash as it did off the shelf.",
    specs: [["Fabric", "100% Supima cotton jersey, 240gsm"], ["Fit", "Boxy, slightly cropped"], ["Finish", "Garment-dyed, enzyme washed"], ["Origin", "Made in Los Angeles"]],
    colors: [
      { name: "Chalk", hex: "#efece6", image: "1521572163474-6864f9cf17ab", detail: { x: 0.5, y: 0.3, z: 1.8 } },
      { name: "Ink", hex: "#1b1b1d", image: "1618354691373-d851c5c3a990" },
    ],
    sizes: apparelSizes,
    featured: true,
    daysAgo: 90,
  },
  {
    name: "Loop-back Crew",
    category: "apparel",
    price: 12800,
    tagline: "French terry sweatshirt with a lived-in drape.",
    description:
      "A crewneck sweatshirt in heavyweight loop-back terry, brushed on the inside only where it matters. Raglan sleeves give it an easy shoulder and the hem rib is cut slightly longer so it never rides up.",
    specs: [["Fabric", "Organic cotton loop-back terry, 420gsm"], ["Fit", "Relaxed"], ["Details", "Raglan sleeve, flatlock seams"], ["Origin", "Made in Portugal"]],
    colors: [{ name: "Chalk", hex: "#f1efea", image: "1620799140408-edc6dcb6d633", detail: { x: 0.5, y: 0.3, z: 1.9 } }],
    sizes: apparelSizes,
    daysAgo: 22,
  },
  {
    name: "Selvedge Trucker Jacket",
    category: "apparel",
    price: 24500,
    tagline: "14oz Okayama selvedge that fades to you.",
    description:
      "Woven on shuttle looms in Okayama, Japan, our raw selvedge denim is rope-dyed with natural indigo for high-contrast fading. The corduroy collar, copper buttons and chain-stitched hems are details you’ll notice in a decade.",
    specs: [["Denim", "14oz raw selvedge, Okayama"], ["Collar", "Cotton corduroy"], ["Hardware", "Copper donut buttons"], ["Origin", "Made in Japan"]],
    colors: [{ name: "Raw Indigo", hex: "#25324a", image: "1611312449408-fcece27cdbb7", detail: { x: 0.5, y: 0.25, z: 2 } }],
    sizes: apparelSizes,
    featured: true,
    daysAgo: 3,
  },
  {
    name: "Weekend Fleece Hoodie",
    category: "apparel",
    price: 13800,
    tagline: "Cloud-soft fleece for early starts and late finishes.",
    description:
      "A double-layer hood, a kangaroo pocket that actually fits your hands, and recycled fleece brushed to an almost suede-like softness. Made for cold mornings, long drives and everything between.",
    specs: [["Fabric", "70% organic cotton, 30% recycled polyester fleece"], ["Fit", "Regular"], ["Hood", "Double-layer, no drawcord"], ["Origin", "Made in Portugal"]],
    colors: [{ name: "Heather Grey", hex: "#9ea3a8", image: "1556821840-3a63f95609a7" }],
    sizes: apparelSizes,
    stock: "low",
    daysAgo: 55,
  },
  {
    name: "Soft Pleat Trouser",
    category: "apparel",
    price: 16500,
    tagline: "A fluid, high-rise trouser with a gathered ankle.",
    description:
      "Cut from a sand-washed Tencel twill that moves like silk but washes like cotton. A single front pleat and elasticated ankle make it as at home with sneakers as it is with heels.",
    specs: [["Fabric", "100% Tencel lyocell twill"], ["Rise", "High"], ["Closure", "Concealed zip, horn button"], ["Origin", "Made in Portugal"]],
    colors: [{ name: "Blush", hex: "#d9b4a8", image: "1594633312681-425c7b97ccd1", detail: { x: 0.5, y: 0.45, z: 1.8 } }],
    sizes: apparelSizes,
    daysAgo: 12,
  },
  // Footwear
  {
    name: "Verde Suede Brogue",
    category: "footwear",
    price: 31000,
    tagline: "A wingtip brogue in unexpected forest suede.",
    description:
      "Hand-lasted in Northampton from repello suede that shrugs off light rain. A Goodyear-welted leather sole means these can be resoled for life — and they get better every time.",
    specs: [["Upper", "Repello calf suede"], ["Construction", "Goodyear welted"], ["Sole", "Oak-bark tanned leather"], ["Origin", "Made in England"]],
    colors: [{ name: "Verde", hex: "#3c7d6c", image: "1560343090-f0409e92791a", detail: { x: 0.6, y: 0.65, z: 2 } }],
    sizes: shoeSizes,
    daysAgo: 70,
  },
  {
    name: "Atelier Derby",
    category: "footwear",
    price: 34000,
    tagline: "Polished cognac calf. Endlessly versatile.",
    description:
      "A clean, plain-toe derby in burnished calf leather. Its slightly chunky profile works with tailoring and denim alike, and the storm welt keeps water out on wet commutes.",
    specs: [["Upper", "Box calf, hand-burnished"], ["Construction", "Goodyear welted, storm welt"], ["Sole", "Dainite rubber"], ["Origin", "Made in Spain"]],
    colors: [{ name: "Cognac", hex: "#8a4b26", image: "1614252235316-8c857d38b5f4", detail: { x: 0.4, y: 0.4, z: 1.7 } }],
    sizes: shoeSizes,
    featured: true,
    daysAgo: 33,
  },
  {
    name: "Court Canvas Low",
    category: "footwear",
    price: 9500,
    tagline: "A vulcanised canvas sneaker with serious staying power.",
    description:
      "Heavy cotton canvas, a cushioned cork-blend insole and a vulcanised gum sole. A sneaker you’ll reach for every day — and one that looks better scuffed.",
    specs: [["Upper", "12oz cotton canvas"], ["Insole", "Cork & latex blend"], ["Sole", "Vulcanised natural rubber"], ["Origin", "Made in Portugal"]],
    colors: [{ name: "Oxblood", hex: "#6b1f2a", image: "1525966222134-fcfa99b8ae77", detail: { x: 0.45, y: 0.5, z: 1.8 } }],
    sizes: shoeSizes,
    daysAgo: 15,
  },
  {
    name: "Strata Runner",
    category: "footwear",
    price: 16500,
    compareAt: 19500,
    tagline: "An engineered-knit runner for the 10k and the commute.",
    description:
      "A single-piece engineered knit upper hugs the foot without seams, while a responsive bio-based foam midsole gives every step a little more return. Lightweight enough for runs, refined enough for the office.",
    specs: [["Upper", "Recycled engineered knit"], ["Midsole", "Bio-based EVA, 32mm stack"], ["Drop", "8mm"], ["Weight", "245g (size 42)"]],
    colors: [
      { name: "Onyx", hex: "#2a2a2c", image: "1491553895911-0055eca6402d" },
      { name: "Pastel", hex: "#c9c1e8", image: "1595950653106-6c9ebd614d3a" },
    ],
    sizes: shoeSizes,
    featured: true,
    daysAgo: 8,
  },
  // Bags
  {
    name: "Commuter Backpack",
    category: "bags",
    price: 19500,
    tagline: "A weatherproof 20L pack with a padded 16\" laptop sleeve.",
    description:
      "Built from a recycled, waxed-finish nylon that sheds rain and resists abrasion. A clamshell opening, a hidden passport pocket against your back and a luggage pass-through make it the only bag you need for a work trip.",
    specs: [["Capacity", "20 litres"], ["Material", "Recycled 600D nylon, PU coated"], ["Laptop", "Fits 16\" devices"], ["Weight", "0.9kg"]],
    colors: [{ name: "Navy", hex: "#1f2a44", image: "1553062407-98eeb64c6a62", detail: { x: 0.55, y: 0.6, z: 2 } }],
    daysAgo: 48,
  },
  {
    name: "Heritage Leather Rucksack",
    category: "bags",
    price: 42500,
    tagline: "Full-grain leather that will outlive us all.",
    description:
      "A classic rucksack made from a single hide of full-grain, pull-up leather. Oils move through the leather as it flexes, so creases lighten and the bag develops a character that’s entirely its own.",
    specs: [["Leather", "Full-grain pull-up cowhide"], ["Capacity", "18 litres"], ["Lining", "Organic cotton canvas"], ["Origin", "Made in Mexico"]],
    colors: [{ name: "Saddle", hex: "#7b4a32", image: "1622560480605-d83c853bc5c3", detail: { x: 0.5, y: 0.5, z: 2 } }],
    featured: true,
    daysAgo: 28,
  },
  {
    name: "Arc Crossbody",
    category: "bags",
    price: 27500,
    tagline: "A structured crossbody with a soft, rounded flap.",
    description:
      "Precisely sized for phone, keys, cardholder and a lipstick — nothing more. The adjustable strap converts to shoulder carry, and the magnetic closure is hidden behind a stitched leather tab.",
    specs: [["Leather", "Smooth Italian calf"], ["Dimensions", "22 × 15 × 7cm"], ["Strap", "Adjustable, 100–125cm"], ["Origin", "Made in Italy"]],
    colors: [{ name: "Tan", hex: "#a5603a", image: "1600857062241-98e5dba7f214", detail: { x: 0.5, y: 0.55, z: 1.7 } }],
    featured: true,
    daysAgo: 4,
  },
  {
    name: "Rosso Top Handle",
    category: "bags",
    price: 46000,
    tagline: "A sculpted top-handle bag in lacquered red.",
    description:
      "An architectural top-handle bag with a polished turn-lock and a detachable shoulder strap. Lined in suede and finished by hand, it’s a piece designed to be handed down.",
    specs: [["Leather", "Lacquered calf"], ["Lining", "Suede"], ["Dimensions", "26 × 20 × 11cm"], ["Origin", "Made in Italy"]],
    colors: [{ name: "Rosso", hex: "#b42a24", image: "1584917865442-de89df76afd3", detail: { x: 0.5, y: 0.5, z: 2 } }],
    stock: "soldout",
    daysAgo: 60,
  },
  {
    name: "Bifold Wallet",
    category: "bags",
    price: 8500,
    tagline: "Six cards, folded notes, zero bulk.",
    description:
      "Cut from a single piece of bridle leather and saddle-stitched by hand with waxed linen thread. It starts stiff, then relaxes into the shape of your pocket within a few weeks.",
    specs: [["Leather", "English bridle leather"], ["Capacity", "6 cards + notes"], ["Stitching", "Hand saddle-stitched"], ["Origin", "Made in England"]],
    colors: [{ name: "Chestnut", hex: "#6b3b22", image: "1627123424574-724758594e93", detail: { x: 0.5, y: 0.5, z: 1.8 } }],
    daysAgo: 100,
  },
  // Accessories
  {
    name: "Meridian Automatic",
    category: "accessories",
    price: 125000,
    tagline: "An open-heart automatic on hand-stitched leather.",
    description:
      "A 40mm automatic with a visible balance wheel at six o’clock, sapphire crystal front and back, and a 42-hour power reserve. The strap is cut from vegetable-tanned leather and stitched by hand in our studio.",
    specs: [["Case", "40mm 316L steel"], ["Movement", "Automatic, 42h reserve"], ["Crystal", "Sapphire, AR coated"], ["Water resistance", "50m"]],
    colors: [{ name: "Ivory Dial", hex: "#efe6d4", image: "1524805444758-089113d48a6d", detail: { x: 0.45, y: 0.6, z: 2 } }],
    featured: true,
    stock: "low",
    daysAgo: 18,
  },
  {
    name: "Rosé 36",
    category: "accessories",
    price: 42000,
    tagline: "A petite dress watch with a blush sunray dial.",
    description:
      "A slim 36mm case in rose-gold PVD steel, paired with a Swiss quartz movement and a soft nubuck strap. Elegant enough for evenings, understated enough for every day.",
    specs: [["Case", "36mm, rose-gold PVD"], ["Movement", "Swiss quartz"], ["Strap", "Italian nubuck, quick release"], ["Water resistance", "30m"]],
    colors: [{ name: "Rose Gold", hex: "#c99a86", image: "1522312346375-d1a52e2b99b3", detail: { x: 0.5, y: 0.5, z: 1.8 } }],
    daysAgo: 36,
  },
  {
    name: "Nordlys Minimal Watch",
    category: "accessories",
    price: 26000,
    tagline: "Nothing to read but the time.",
    description:
      "An index-free, matte-black dial floats inside a soft-touch case. Pared back to its essentials, it’s a quiet object you’ll forget you’re wearing — until someone asks.",
    specs: [["Case", "38mm, ceramic-coated steel"], ["Movement", "Japanese quartz"], ["Strap", "FKM rubber, quick release"], ["Water resistance", "50m"]],
    colors: [{ name: "Chalk", hex: "#e8e7e3", image: "1523275335684-37898b6baf30", detail: { x: 0.45, y: 0.5, z: 1.7 } }],
    daysAgo: 75,
  },
  {
    name: "Linked Chain Bracelet",
    category: "accessories",
    price: 18000,
    tagline: "Recycled 14k gold vermeil, hand-linked.",
    description:
      "Each oval link is formed and soldered by hand from recycled sterling silver, then plated in a thick layer of 14k gold. Layer it, or let it stand alone.",
    specs: [["Material", "14k gold vermeil on recycled silver"], ["Length", "17cm + 2cm extender"], ["Clasp", "Lobster"], ["Origin", "Made in Thailand"]],
    colors: [{ name: "Gold", hex: "#d4a35a", image: "1611591437281-460bfbe1220a", detail: { x: 0.5, y: 0.55, z: 1.8 } }],
    daysAgo: 20,
  },
  {
    name: "Halo Pendant Necklace",
    category: "accessories",
    price: 22000,
    tagline: "A crescent of pavé stones on a fine trace chain.",
    description:
      "Lab-grown white sapphires are hand-set into a recycled-gold crescent, suspended from a delicate trace chain. A modern heirloom, designed to be worn every day.",
    specs: [["Material", "14k gold vermeil"], ["Stones", "Lab-grown white sapphire"], ["Chain", "45cm trace, adjustable"], ["Origin", "Made in Thailand"]],
    colors: [{ name: "Gold", hex: "#d4a35a", image: "1599643478518-a784e5dc4c8f" }],
    daysAgo: 9,
  },
  {
    name: "Sculpted Hoops",
    category: "accessories",
    price: 15000,
    tagline: "Twisted, weighty hoops with a molten finish.",
    description:
      "Cast in recycled brass and finished in heavy gold plating, these hoops have a satisfying weight without pulling. Hypoallergenic posts make them comfortable all day.",
    specs: [["Material", "Gold-plated recycled brass"], ["Diameter", "24mm"], ["Posts", "Sterling silver, hypoallergenic"], ["Origin", "Made in Portugal"]],
    colors: [{ name: "Gold", hex: "#d4a35a", image: "1617038220319-276d3cfab638", detail: { x: 0.6, y: 0.55, z: 2 } }],
    featured: true,
    daysAgo: 2,
  },
  {
    name: "Wayfarer Sunglasses",
    category: "accessories",
    price: 17500,
    tagline: "Hand-polished acetate with polarised mineral lenses.",
    description:
      "Cut from Mazzucchelli acetate and polished in a tumbler for three days to a deep, glassy shine. Polarised mineral lenses are scratch-resistant and block 100% of UVA/UVB.",
    specs: [["Frame", "Mazzucchelli acetate"], ["Lenses", "Polarised mineral glass, Cat. 3"], ["Hinge", "5-barrel"], ["Origin", "Made in Japan"]],
    colors: [
      { name: "Black", hex: "#111111", image: "1572635196237-14b3f281503f" },
      { name: "Tortoise & Gold", hex: "#5a3b22", image: "1589782182703-2aaa69037b5b" },
    ],
    daysAgo: 26,
  },
  {
    name: "Washed Twill Cap",
    category: "accessories",
    price: 4500,
    tagline: "A six-panel cap, broken in from day one.",
    description:
      "Garment-washed cotton twill with a soft, unstructured crown and a brass-buckle strap. Gets better the more you wear (and forget about) it.",
    specs: [["Fabric", "100% cotton twill"], ["Closure", "Brass buckle strap"], ["Fit", "One size"], ["Origin", "Made in Portugal"]],
    colors: [{ name: "Washed Black", hex: "#3d3f42", image: "1521369909029-2afed882baee" }],
    daysAgo: 64,
  },
  // Sound & Tech
  {
    name: "Halden One Headphones",
    category: "sound-tech",
    price: 34900,
    compareAt: 39900,
    tagline: "Adaptive noise cancelling. 40-hour battery. Zero fuss.",
    description:
      "Custom 40mm drivers tuned in Copenhagen deliver a warm, detailed sound, while eight microphones adapt noise cancelling to your surroundings in real time. Memory-foam cushions wrapped in protein leather keep them comfortable through a transatlantic flight.",
    specs: [["Drivers", "40mm dynamic, beryllium-coated"], ["Battery", "Up to 40 hours (ANC on)"], ["Charging", "USB-C, 10 min = 5 hours"], ["Connectivity", "Bluetooth 5.3, multipoint, LDAC"], ["Weight", "254g"]],
    colors: [
      { name: "Onyx", hex: "#1f1f21", image: "1618366712010-f4ae9c647dcb", detail: { x: 0.5, y: 0.45, z: 1.7 } },
      { name: "Silver", hex: "#c9cacc", image: "1609081219090-a6d81d3085bf" },
    ],
    featured: true,
    daysAgo: 11,
  },
  {
    name: "Studio On-Ear",
    category: "sound-tech",
    price: 19900,
    tagline: "Aluminium and leather on-ears with a wired heart.",
    description:
      "A lightweight on-ear headphone with a machined aluminium yoke, lambskin cushions and a detachable braided cable. Analogue warmth, no app required.",
    specs: [["Drivers", "40mm dynamic"], ["Impedance", "32Ω"], ["Cable", "Detachable 1.2m braided, 3.5mm"], ["Weight", "188g"]],
    colors: [{ name: "Tan & Silver", hex: "#b36c42", image: "1484704849700-f032a568e944", detail: { x: 0.45, y: 0.5, z: 1.8 } }],
    daysAgo: 82,
  },
  {
    name: "Pocket Buds",
    category: "sound-tech",
    price: 17900,
    tagline: "True wireless earbuds with a pebble-smooth case.",
    description:
      "Small enough to disappear, powerful enough to cancel a train carriage. Pocket Buds offer 8 hours of listening, wireless charging and an IPX5 rating for the run home in the rain.",
    specs: [["Battery", "8h buds + 24h case"], ["ANC", "Hybrid active noise cancelling"], ["Water resistance", "IPX5"], ["Charging", "USB-C & Qi wireless"]],
    colors: [{ name: "Midnight", hex: "#1c2133", image: "1606220945770-b5b6c2c55bf1", detail: { x: 0.55, y: 0.6, z: 1.8 } }],
    featured: true,
    daysAgo: 14,
  },
  {
    name: "Monitor Bookshelf Speakers",
    category: "sound-tech",
    price: 48000,
    tagline: "Powered walnut monitors for the living room.",
    description:
      "A pair of active two-way speakers in solid walnut cabinets with 5.25\" woven-fibre woofers and silk-dome tweeters. Plug in a turntable, stream over Wi-Fi, or connect your TV via HDMI ARC.",
    specs: [["Drivers", "5.25\" woofer, 1\" silk tweeter"], ["Power", "2 × 60W Class D"], ["Inputs", "HDMI ARC, phono, optical, Wi-Fi, Bluetooth"], ["Finish", "Solid walnut veneer"]],
    colors: [{ name: "Walnut", hex: "#5b3a29", image: "1545454675-3531b543be5d", detail: { x: 0.5, y: 0.45, z: 1.7 } }],
    daysAgo: 45,
  },
  {
    name: "Instant Film Camera",
    category: "sound-tech",
    price: 13900,
    tagline: "Point, shoot, wait sixty seconds, smile.",
    description:
      "An analogue instant camera with a sharp autofocus lens, a built-in flash and double-exposure mode. Bundled with a pack of eight colour frames so you can start shooting the moment it arrives.",
    specs: [["Lens", "Autofocus, 2-element"], ["Film", "i-Type & 600 compatible"], ["Battery", "USB-C rechargeable, 15 packs"], ["In the box", "1 pack colour film"]],
    colors: [{ name: "White", hex: "#f2f1ef", image: "1526170375885-4d8ecf77b99f", detail: { x: 0.5, y: 0.45, z: 1.8 } }],
    daysAgo: 30,
  },
  {
    name: "Pulse Smartwatch",
    category: "sound-tech",
    price: 29900,
    tagline: "Health tracking that never shouts.",
    description:
      "An always-on display, seven-day battery, ECG and sleep-stage tracking — wrapped in a lightweight aluminium case with a fluoroelastomer strap. Notifications arrive as a gentle tap, never a buzz.",
    specs: [["Display", "1.8\" AMOLED, always-on"], ["Battery", "Up to 7 days"], ["Sensors", "ECG, SpO₂, skin temperature"], ["Water resistance", "5 ATM"]],
    colors: [
      { name: "Midnight", hex: "#18191b", image: "1617043786394-f977fa12eddf" },
      { name: "Graphite", hex: "#45474b", image: "1546868871-7041f2a55e12" },
    ],
    daysAgo: 5,
  },
  {
    name: "Low Profile Keyboard",
    category: "sound-tech",
    price: 12900,
    tagline: "Quiet scissor switches in a single aluminium slab.",
    description:
      "A full-size wireless keyboard machined from a single block of recycled aluminium. Whisper-quiet scissor switches, three-device switching and a three-month battery make for a calmer desk.",
    specs: [["Switches", "Low-profile scissor"], ["Connectivity", "Bluetooth 5.1 & USB-C"], ["Battery", "Up to 3 months"], ["Layout", "Full size, US ANSI"]],
    colors: [{ name: "Silver", hex: "#d8d9db", image: "1587829741301-dc798b83add3", detail: { x: 0.5, y: 0.5, z: 1.8 } }],
    daysAgo: 95,
  },
  // Home & Apothecary
  {
    name: "Ember No.3 Candle",
    category: "home-apothecary",
    price: 5800,
    tagline: "Smoked cedar, amber and black tea.",
    description:
      "Hand-poured in small batches from a coconut and rapeseed wax blend with a cotton wick. Ember No.3 opens with smoky cedar, settles into warm amber and finishes with a whisper of black tea. Approximately 60 hours of burn time.",
    specs: [["Wax", "Coconut & rapeseed blend"], ["Burn time", "≈ 60 hours"], ["Vessel", "Smoked glass, reusable"], ["Weight", "300g"]],
    colors: [{ name: "Smoked Glass", hex: "#4c4440", image: "1603006905003-be475563bc59", detail: { x: 0.5, y: 0.55, z: 1.7 } }],
    featured: true,
    daysAgo: 16,
  },
  {
    name: "Cedar & Vetiver Body Lotion",
    category: "home-apothecary",
    price: 4200,
    tagline: "Fast-absorbing, deeply grounding.",
    description:
      "A light lotion with shea, squalane and niacinamide that absorbs in seconds, leaving a soft trail of Atlas cedar and Haitian vetiver. Vegan, cruelty-free and packaged in recycled aluminium.",
    specs: [["Volume", "250ml"], ["Key ingredients", "Shea, squalane, niacinamide"], ["Scent", "Cedar, vetiver, bergamot"], ["Packaging", "Recycled aluminium tube"]],
    colors: [{ name: "Original", hex: "#ece8de", image: "1620916566398-39f1143ab7be" }],
    daysAgo: 42,
  },
  {
    name: "Apothecary Ritual Set",
    category: "home-apothecary",
    price: 9600,
    compareAt: 11800,
    tagline: "Oil, mask and balm — an evening in three steps.",
    description:
      "Our three best-selling botanicals in one box: a cold-pressed hemp seed oil, an activated-charcoal clay mask and a whipped body balm. Thoughtfully wrapped, ready to give (or keep).",
    specs: [["Includes", "Face oil 30ml, clay mask 50ml, body balm 100ml"], ["Skin types", "All"], ["Formulation", "Vegan, fragrance-free"], ["Origin", "Made in Denmark"]],
    colors: [{ name: "Gift Box", hex: "#3c3a35", image: "1611930022073-b7a4ba5fcccd", detail: { x: 0.5, y: 0.35, z: 1.8 } }],
    daysAgo: 7,
  },
  {
    name: "Botanical Face Oil",
    category: "home-apothecary",
    price: 6800,
    tagline: "Rosehip, sea buckthorn and bakuchiol.",
    description:
      "A featherweight facial oil that brightens and firms overnight. Bakuchiol — a gentle, plant-derived retinol alternative — works with rosehip and sea buckthorn to restore radiance by morning.",
    specs: [["Volume", "30ml"], ["Key ingredients", "Rosehip, sea buckthorn, bakuchiol"], ["Use", "2–3 drops, evening"], ["Packaging", "Amber glass, pipette"]],
    colors: [{ name: "Original", hex: "#c6873e", image: "1612817288484-6f916006741a", detail: { x: 0.55, y: 0.5, z: 1.8 } }],
    daysAgo: 52,
  },
];

/* ----------------------------------------------------------------------------
 * People & content
 * ------------------------------------------------------------------------- */
const reviewers = [
  "Maya Lindqvist", "Jonah Okafor", "Priya Raman", "Theo Marchetti", "Ines Duarte", "Samuel Kim",
  "Aiyana Brooks", "Lukas Becker", "Noor Haddad", "Elena Petrova", "Kai Nakamura", "Grace Whitfield",
];

const reviewPool: Record<number, { title: string; body: string }[]> = {
  5: [
    { title: "Worth every penny", body: "The quality is immediately obvious the second you open the box. Materials feel substantial and the finishing is impeccable. I've already ordered a second one as a gift." },
    { title: "My new everyday favourite", body: "I've worn this almost daily for a month and it still looks brand new. Fit is exactly as described, and the details are thoughtful in ways you notice over time." },
    { title: "Beautifully made", body: "You can tell real care went into this. It arrived beautifully packaged, and it's even better in person than in the photos. Customer service was lovely too." },
    { title: "Exceeded expectations", body: "I was hesitant at this price point but it absolutely delivers. Compared side by side with designer brands at twice the price, this wins on craftsmanship." },
  ],
  4: [
    { title: "Great, with one small note", body: "Really lovely piece and the quality is excellent. Runs very slightly large for me, so consider sizing down if you're between sizes. Otherwise perfect." },
    { title: "Very happy", body: "Solid construction and a beautiful colour. Shipping took a day longer than estimated, but it was worth the wait. Would buy from Halden again." },
    { title: "Lovely quality", body: "Feels premium without being precious. I'd have liked one more colour option, but the one I chose is gorgeous and goes with everything I own." },
  ],
  3: [
    { title: "Good but not perfect", body: "Nice materials and a clean design, but it took a while to break in. I think it will be great with time — just not immediately comfortable out of the box." },
  ],
};

const streets = ["Valencia Street", "Hayes Street", "Grand Avenue", "Ocean Drive", "Linden Lane", "Market Street", "Maple Court"];
const cities = [
  ["San Francisco", "CA", "94110"], ["Brooklyn", "NY", "11211"], ["Austin", "TX", "78704"],
  ["Portland", "OR", "97214"], ["Chicago", "IL", "60622"], ["Seattle", "WA", "98122"],
] as const;

/* ----------------------------------------------------------------------------
 * Seed
 * ------------------------------------------------------------------------- */

/** Seeded account credentials come from the environment so no password ever lives in the repo. */
function seedAccounts() {
  const problems: string[] = [];
  const read = (name: string) => {
    const value = process.env[name];
    if (!value) {
      problems.push(`${name} is not set`);
      return "";
    }
    const parsed = passwordSchema.safeParse(value);
    if (!parsed.success) problems.push(`${name} is too weak: ${parsed.error.issues.map((i) => i.message).join(", ")}`);
    return value;
  };
  const accounts = {
    adminEmail: process.env.SEED_ADMIN_EMAIL || "admin@example.com",
    adminPassword: read("SEED_ADMIN_PASSWORD"),
    userEmail: process.env.SEED_USER_EMAIL || "customer@example.com",
    userPassword: read("SEED_USER_PASSWORD"),
  };
  if (problems.length) {
    console.error(
      [
        "✋ Seed aborted: the seeded accounts need passwords from the environment.",
        ...problems.map((p) => `   • ${p}`),
        "   Set SEED_ADMIN_PASSWORD and SEED_USER_PASSWORD in .env (8+ chars with upper, lower and a number).",
        "   Optional: SEED_ADMIN_EMAIL and SEED_USER_EMAIL (defaults: admin@example.com, customer@example.com).",
      ].join("\n"),
    );
    process.exit(1);
  }
  return accounts;
}

async function main() {
  const guard = checkSeedSafety(process.env);
  if (!guard.ok) {
    console.error(`✋ Seed refused: ${guard.reason}`);
    process.exit(1);
  }
  console.log(`🌱 Seeding database on ${guard.host}`);
  const accounts = seedAccounts();

  console.log("🌱 Resetting data…");
  await db.$transaction([
    db.orderItem.deleteMany(),
    db.order.deleteMany(),
    db.cartItem.deleteMany(),
    db.wishlistItem.deleteMany(),
    db.review.deleteMany(),
    db.image.deleteMany(),
    db.variant.deleteMany(),
    db.product.deleteMany(),
    db.category.deleteMany(),
    db.address.deleteMany(),
    db.user.deleteMany(),
    db.promoCode.deleteMany(),
    db.contactMessage.deleteMany(),
    db.newsletterSubscriber.deleteMany(),
    db.upload.deleteMany(),
  ]);

  console.log("👤 Users");
  const [adminHash, userHash, crowdHash] = await Promise.all([
    bcrypt.hash(accounts.adminPassword, 12),
    bcrypt.hash(accounts.userPassword, 12),
    bcrypt.hash(`Crowd-${Math.random()}`, 10),
  ]);
  await db.user.create({ data: { name: "Halden Admin", email: accounts.adminEmail, passwordHash: adminHash, role: "ADMIN" } });
  const demo = await db.user.create({
    data: {
      name: "Alex Morgan",
      email: accounts.userEmail,
      passwordHash: userHash,
      phone: "+1 415 555 0199",
      addresses: {
        create: [
          { label: "Home", fullName: "Alex Morgan", line1: "1480 Valencia Street", line2: "Apt 4", city: "San Francisco", state: "CA", postalCode: "94110", country: "United States", phone: "+1 415 555 0199", isDefault: true },
          { label: "Studio", fullName: "Alex Morgan", line1: "88 Townsend Street", city: "San Francisco", state: "CA", postalCode: "94107", country: "United States", phone: "+1 415 555 0199" },
        ],
      },
    },
  });
  const crowd = await Promise.all(
    reviewers.map((name, i) =>
      db.user.create({
        data: {
          name,
          email: `${name.split(" ")[0].toLowerCase()}.${i}@example.com`,
          passwordHash: crowdHash,
          createdAt: new Date(Date.now() - between(20, 200) * 86400000),
        },
      }),
    ),
  );

  console.log("🗂  Categories");
  const categoryIds = new Map<string, string>();
  for (const [i, c] of categories.entries()) {
    const created = await db.category.create({ data: { ...c, sortOrder: i } });
    categoryIds.set(c.slug, created.id);
  }

  console.log("🛍  Products");
  const createdProducts: { id: string; name: string; image: string; variants: { id: string; label: string; price: number }[] }[] = [];
  for (const p of products) {
    const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const skuBase = slug.split("-").map((w) => w.slice(0, 3)).join("").toUpperCase().slice(0, 9);
    const images = p.colors.flatMap((c) => {
      const list = [{ url: img(c.image), alt: `${p.name} in ${c.name}`, colorKey: c.name }];
      if (c.detail) list.push({ url: img(c.image, c.detail), alt: `${p.name} in ${c.name}, detail`, colorKey: c.name });
      return list;
    });
    const sizes = p.sizes ?? [null];
    const variants = p.colors.flatMap((c) =>
      sizes.map((s) => {
        // Occasionally sell out one option of multi-variant products to exercise stock awareness.
        let stock = p.colors.length * sizes.length > 1 && between(0, 9) === 0 ? 0 : between(6, 40);
        if (p.stock === "low") stock = between(1, 4);
        if (p.stock === "soldout") stock = 0;
        return {
          sku: `${skuBase}-${c.name.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase()}${s ? `-${s}` : ""}`,
          color: c.name,
          colorHex: c.hex,
          size: s,
          stock,
        };
      }),
    );
    const created = await db.product.create({
      data: {
        name: p.name,
        slug,
        tagline: p.tagline,
        description: p.description,
        specs: p.specs.map(([label, value]) => ({ label, value })),
        price: p.price,
        compareAt: p.compareAt ?? null,
        featured: p.featured ?? false,
        categoryId: categoryIds.get(p.category)!,
        createdAt: new Date(Date.now() - p.daysAgo * 86400000),
        images: { create: images.map((im, position) => ({ ...im, position })) },
        variants: { create: variants },
      },
      include: { variants: true },
    });
    createdProducts.push({
      id: created.id,
      name: created.name,
      image: images[0].url,
      variants: created.variants.map((v) => ({
        id: v.id,
        label: [v.color, v.size].filter(Boolean).join(" / "),
        price: v.price ?? created.price,
      })),
    });

    // Reviews
    const reviewCount = between(2, 7);
    const authors = [...crowd].sort(() => rand() - 0.5).slice(0, reviewCount);
    const ratings: number[] = [];
    for (const author of authors) {
      const r = rand();
      const rating = r < 0.62 ? 5 : r < 0.92 ? 4 : 3;
      ratings.push(rating);
      const copy = pick(reviewPool[rating]);
      await db.review.create({
        data: {
          rating,
          title: copy.title,
          body: copy.body,
          userId: author.id,
          productId: created.id,
          createdAt: new Date(Date.now() - between(1, Math.max(2, p.daysAgo)) * 86400000),
        },
      });
    }
    await db.product.update({
      where: { id: created.id },
      data: {
        reviewCount: ratings.length,
        rating: Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10,
      },
    });
  }

  console.log("🏷  Promo codes");
  await db.promoCode.createMany({
    data: [
      { code: "WELCOME10", description: "10% off your first order", type: "PERCENT", value: 10 },
      { code: "HALDEN20", description: "20% off orders over $250", type: "PERCENT", value: 20, minSubtotal: 25000 },
      { code: "TAKE25", description: "$25 off orders over $150", type: "FIXED", value: 2500, minSubtotal: 15000 },
      { code: "FREESHIP", description: "Free shipping on any delivery method", type: "FREE_SHIPPING", value: 0 },
    ],
  });

  console.log("📦 Orders");
  const methods: DeliveryMethod[] = ["STANDARD", "STANDARD", "EXPRESS", "NEXT_DAY"];
  const shippingCost: Record<DeliveryMethod, number> = { STANDARD: 800, EXPRESS: 1800, NEXT_DAY: 3200 };
  const sales = new Map<string, number>();

  async function createOrder(userId: string, email: string, name: string, daysAgo: number, status: OrderStatus, n: number) {
    const lines = [...createdProducts].sort(() => rand() - 0.5).slice(0, between(1, 3)).map((p) => {
      const v = pick(p.variants);
      const quantity = between(1, 2);
      sales.set(p.id, (sales.get(p.id) ?? 0) + quantity);
      return { productId: p.id, variantId: v.id, name: p.name, image: p.image, variant: v.label, unitPrice: v.price, quantity };
    });
    const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
    const method = pick(methods);
    const shipping = method === "STANDARD" && subtotal >= 15000 ? 0 : shippingCost[method];
    const tax = Math.round(subtotal * 0.0825);
    const [city, st, zip] = pick(cities);
    const createdAt = new Date(Date.now() - daysAgo * 86400000 - between(0, 20) * 3600000);
    await db.order.create({
      data: {
        number: `HL-${(104200 + n).toString()}`,
        status,
        email,
        subtotal,
        shipping,
        tax,
        total: subtotal + shipping + tax,
        deliveryMethod: method,
        paymentProvider: "mock",
        paymentRef: `mock_${Math.floor(rand() * 1e10).toString(36)}`,
        cardLast4: pick(["4242", "1881", "0005", "4444"]),
        shipName: name,
        shipLine1: `${between(10, 2400)} ${pick(streets)}`,
        shipCity: city,
        shipState: st,
        shipPostalCode: zip,
        shipCountry: "United States",
        shipPhone: "+1 555 010 2200",
        userId,
        createdAt,
        updatedAt: createdAt,
        items: { create: lines },
      },
    });
  }

  let n = 0;
  // Demo customer's history covers every status for the tracking UI.
  const demoHistory: [number, OrderStatus][] = [[2, "PAID"], [9, "SHIPPED"], [24, "DELIVERED"], [58, "DELIVERED"], [80, "CANCELLED"]];
  for (const [days, status] of demoHistory) await createOrder(demo.id, demo.email, demo.name, days, status, n++);
  // Store-wide orders across the last 60 days for the admin dashboard.
  for (let i = 0; i < 64; i++) {
    const days = between(0, 59);
    const status: OrderStatus =
      days > 14 ? (rand() < 0.08 ? "CANCELLED" : "DELIVERED") : days > 5 ? pick(["SHIPPED", "DELIVERED"] as const) : pick(["PENDING", "PAID", "PAID", "SHIPPED"] as const);
    const c = pick(crowd);
    await createOrder(c.id, c.email, c.name, days, status, n++);
  }
  for (const [productId, count] of sales) {
    await db.product.update({ where: { id: productId }, data: { salesCount: count * 7 + between(0, 30) } });
  }

  console.log("✉️  Messages");
  await db.contactMessage.createMany({
    data: [
      { name: "Ines Duarte", email: "ines@example.com", topic: "order", message: "Hi! Could I change the delivery address on order HL-104231? I’ll be at my studio that week.", createdAt: new Date(Date.now() - 3600000 * 5) },
      { name: "Theo Marchetti", email: "theo@example.com", topic: "product", message: "Does the Atelier Derby run true to size? I’m usually a 43 in most brands but a 42.5 in Alden.", createdAt: new Date(Date.now() - 86400000 * 1.5) },
      { name: "Clara Hughes", email: "clara@press.example", topic: "press", message: "I’m putting together a holiday gift guide for Kinfolk and would love to include the Apothecary Ritual Set. Is there a press contact?", isRead: true, createdAt: new Date(Date.now() - 86400000 * 4) },
    ],
  });

  console.log(`✅ Seeded ${products.length} products, ${categories.length} categories, ${n} orders.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
