/**
 * Development seed photography. All images are free-to-use Unsplash photographs (Unsplash
 * License) served from Unsplash's CDN; the app's image loader requests resized versions.
 * Three legacy photographs are re-encoded under /public/images.
 */
export interface SeedImage {
  src: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
  blurDataURL: string;
}

const unsplash = (id: string, alt: string): SeedImage => ({
  src: `https://images.unsplash.com/photo-${id}`,
  width: 2400,
  height: 1600,
  alt,
  caption: "",
  blurDataURL: "",
});

export const legacyImages = {
  coastalVilla: {
    src: "/images/hero/coastal-villa/w2560.webp",
    width: 2560,
    height: 989,
    alt: "Stone-and-glass villa on a hillside above a calm bay at sunset",
    caption: "",
    blurDataURL:
      "data:image/webp;base64,UklGRkgAAABXRUJQVlA4IDwAAADwAQCdASoQAAYAA4BaJZQC7AEemXIfagAA4n38GpaanduA/rjV/amjSmtKZulrc0T/yCxc3Tp4GoR0AAA=",
  },
  gardenVilla: {
    src: "/images/residences/garden-villa/w2560.webp",
    width: 2560,
    height: 1707,
    alt: "White contemporary villa with floor-to-ceiling glass beside a pool",
    caption: "",
    blurDataURL:
      "data:image/webp;base64,UklGRngAAABXRUJQVlA4IGwAAABwAgCdASoQAAsAA4BaJbACdAYt9uPKTRmVmCgAAP6UiRgcTECZjV9j0wgds2QMBnHCnzGaPbNOnqXpNMCyO3doY3AIMieHLdy1gqfdrgNygqiSYwpAEduw6F3AXepgHvwc3sBuyk+HJKDpAAA=",
  },
  brightInterior: {
    src: "/images/residences/bright-interior/w2560.webp",
    width: 2560,
    height: 1707,
    alt: "Bright open-plan living and dining room with tall windows",
    caption: "",
    blurDataURL:
      "data:image/webp;base64,UklGRnIAAABXRUJQVlA4IGYAAABwAgCdASoQAAsAA4BaJQBdgMXD36zrg52GceGkAP7I9w3SZslAMA/XMNbsU9m4chJ6kpa0NO1sr9Qv+SgnLrc6/dH3pJmpylZXI/7+y2caEwnHzBDogIL3UEaHQ3S4xspN8plgAAA=",
  },
} satisfies Record<string, SeedImage>;

export const villaExteriors = [
  unsplash("1580587771525-78b9dba3b914", "Two-storey villa with white render and timber detailing"),
  unsplash("1706808849780-7a04fbac83ef", "Modern house with a pool and lounge chairs"),
  unsplash("1757524492552-d47a66a2b63e", "Modern house with large windows at dusk"),
  unsplash("1613977257365-aaae5a9817ff", "White villa with a long swimming pool"),
  unsplash("1613977257363-707ba9348227", "Modern white villa with pool and outdoor lounge"),
  unsplash("1600596542815-ffad4c1539a9", "Contemporary white house under a clear blue sky"),
  unsplash("1613977257592-4871e5fcd7c4", "Poolside terrace of a modern white villa"),
  unsplash("1759372945658-1e9f56e751bd", "Tropical villa with a pool at twilight"),
  unsplash("1602343168117-bb8ffe3e2e9f", "Villa beside a swimming pool with timber screens"),
  unsplash("1623298317883-6b70254edf31", "House with tall windows lit up at night"),
  unsplash("1670589953882-b94c9cb380f5", "Low-rise building with a pool in the foreground"),
  unsplash("1758192838598-a1de4da5dcaf", "Infinity pool at sunset framed by palms"),
  unsplash("1758026164848-0a9fb178c070", "Pool deck with shaded seating"),
  unsplash("1688653802629-5360086bf632", "Detached house with a landscaped driveway"),
];

export const apartmentExteriors = [
  unsplash("1515263487990-61b07816b324", "Concrete residential tower photographed from below"),
  unsplash(
    "1784853879843-f3c5aacf2569",
    "Apartment building with deep balconies and large windows",
  ),
  unsplash("1545324418-cc1a3fa10c00", "High-rise apartment building against the sky"),
  unsplash("1775733924031-521cd86c69cc", "Apartment building with planted balconies"),
  unsplash("1624204386084-dd8c05e32226", "Glass balconies reflecting a pink evening sky"),
  unsplash("1762172453959-38ab954a7aa4", "Modern residential building with balconies"),
  unsplash("1761509386107-9baefe0073f2", "Building with curved balconies and trees"),
  unsplash("1619994121345-b61cd610c5a6", "White residential building in daylight"),
];

export const livingRooms = [
  unsplash("1583847268964-b28dc8f51f92", "Living room with a large window and soft seating"),
  unsplash("1758448511322-8bfc73daf606", "Living room with a sectional sofa and wide window"),
  unsplash("1564078516393-cf04bd966897", "Grey chaise beside a tall window"),
  unsplash("1758565811176-ccd94357a844", "Living room with large windows and a view"),
  unsplash(
    "1598928506311-c55ded91a20c",
    "Living room with marble fireplace and dark timber shelving",
  ),
  unsplash("1618221195710-dd6b41faaea6", "Neutral living room with layered textures"),
  unsplash("1757524503555-b62633f47670", "Living room with fireplace and floor-to-ceiling glass"),
  unsplash("1560448204-e02f11c3d0e2", "Beige sofa and armchair in a calm sitting room"),
  unsplash("1768144092684-c1a5dd6c7aad", "Cream sofa with low coffee tables"),
  unsplash("1600210491892-03d54c0aaf87", "White armchairs beside a fireplace"),
  unsplash("1554995207-c18c203602cb", "Open living space with pale timber floors"),
  unsplash("1613545325278-f24b0cae1224", "Living room in warm neutral tones"),
  unsplash("1565623833408-d77e39b88af6", "Apartment interior with city views"),
  unsplash("1568115286680-d203e08a8be6", "Lounge with full-height glazing"),
  unsplash("1776362355123-ca966d36e29c", "Double-height living room with a staircase"),
  unsplash("1699225741963-5e8e15e40719", "Living room filled with daylight"),
  unsplash("1633694705199-bc1e0a87c97a", "Living room arranged around a large window"),
  unsplash("1758448511320-05d7d28f4298", "Living room with a wide window and ocean view"),
];

export const kitchens = [
  unsplash("1696986681606-b156ccd761c5", "Kitchen with range cooker beside a window"),
  unsplash("1778731660397-6a66493be391", "Kitchen island with bar stools"),
  unsplash("1628745277862-bc0b2d68c50c", "Kitchen with white and timber cabinetry"),
  unsplash("1786053538161-501fbdd89629", "Large kitchen island opening to a patio"),
  unsplash("1632583824020-937ae9564495", "Modern kitchen with a breakfast bar"),
  unsplash("1785535573585-8f962fa3cda5", "Marble kitchen island with stools"),
  unsplash("1611095210561-67f0832b1ca3", "Dining table beside an open kitchen"),
];

export const bedrooms = [
  unsplash("1616594039964-ae9021a400a0", "Bedroom with upholstered bed and city view"),
  unsplash("1765862835260-47843a7bba45", "Minimal bedroom with a large bed"),
  unsplash("1578683010236-d716f9a3f461", "Bedroom with a sitting area"),
  unsplash("1784653549288-07343300a44f", "Bedroom with bench and statement chandelier"),
  unsplash("1505693416388-ac5ce068fe85", "Tufted headboard and cream bench in a bedroom"),
  unsplash("1778731525620-ae459167c176", "Bedroom with a white bench at the foot of the bed"),
  unsplash("1562438668-bcf0ca6578f0", "Grey bed in a quiet bedroom"),
  unsplash("1566665797739-1674de7a421a", "Bedroom with blue upholstered headboard"),
];

export const bathrooms = [
  unsplash("1584622650111-993a426fbf0a", "Bathroom with walk-in shower and vanity"),
  unsplash("1781344334947-60c704bafd51", "Bathroom with double basins and freestanding bath"),
  unsplash("1631889993959-41b4e9c6e3c5", "Bathroom with bath and stone surfaces"),
  unsplash("1776525433347-13ffc965601a", "Modern bathroom with a deep bath"),
  unsplash("1507652313519-d4e9174996dd", "Freestanding white bath"),
  unsplash("1765745518673-b562b7304a53", "Bathroom in marble and timber"),
];

export const terraces = [
  unsplash("1776363284806-873eeef565a7", "Rooftop terrace with seating and a tree"),
  unsplash("1776361964513-86fba5039617", "Rooftop pool overlooking a city skyline at dusk"),
];

export const placeImages = {
  dhaka: [
    unsplash("1706640254398-3b04782e8c76", "Aerial view of a river running through Dhaka"),
    unsplash("1630987871777-f7b2d62894d0", "Dhaka buildings under a blue sky"),
    unsplash("1780345493603-f99734ebd936", "Dhaka skyline under a blue sky"),
    unsplash("1653932133705-851f4547eb2b", "Tall buildings across the Dhaka skyline"),
    unsplash("1767330854970-2d5b44fae382", "Tree-lined Dhaka street"),
    unsplash("1630987437576-92688f9ad653", "Dhaka skyline beneath monsoon clouds"),
  ],
  chattogram: [
    unsplash("1612625376899-c4de74027429", "Chattogram high-rises at night"),
    unsplash("1703360171163-2b1b8836cf6c", "View across Chattogram from a rooftop"),
    unsplash("1625234143031-c983c2542cba", "Boats silhouetted at sunset off Chattogram"),
  ],
  coxsBazar: [
    unsplash("1608958435020-e8a7109ba809", "Fishing boat on the shore at Cox's Bazar"),
    unsplash("1587222318667-31212ce2828d", "Boat on the Bay of Bengal under a blue sky"),
    unsplash("1609501285437-4eb001f82684", "Waves breaking on the beach"),
    unsplash("1587302525159-2363f54affd4", "Beach chair on the sand"),
  ],
  sylhet: [
    unsplash("1706444326115-6a659b5cfda5", "Tea garden surrounded by trees near Sylhet"),
    unsplash("1667120205301-a2a3a886886e", "Rolling hill with trees"),
    unsplash("1671576467966-c6279438f63f", "Field of tea bushes with trees beyond"),
  ],
};
