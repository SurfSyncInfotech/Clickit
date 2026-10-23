// Images (Unsplash) + copy for the public website
const U = (id, w = 900, h) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}${h ? `&h=${h}` : ''}&q=75`
export const IMG = {
  heroA: (w) => U('1758273238415-01ec03d9ef27', w),
  heroB: (w) => U('1758273705627-937374bfa978', w),
  clean1: (w) => U('1758272421751-963195322eaa', w),
  clean2: (w) => U('1758273705723-26ef454252ce', w),
  clean3: (w) => U('1758272421995-e993f97fae22', w),
  mop: (w) => U('1758272422189-b10f36fd4ddd', w),
  dishes: (w) => U('1644056347416-8180f2548fc1', w),
  dishes2: (w) => U('1579716035750-92c059fe9f21', w),
  sink: (w) => U('1736433622548-4adbbc1c2cf2', w),
  bath1: (w) => U('1584622650111-993a426fbf0a', w),
  bath2: (w) => U('1552321554-5fefe8c9ef14', w),
  bath3: (w) => U('1587527901949-ab0341697c1e', w),
  laundry: (w) => U('1635274605638-d44babc08a4f', w),
  laundry2: (w) => U('1696546761269-a8f9d2b80512', w),
  basket: (w) => U('1582735689369-4fe89db7114c', w),
  food: (w) => U('1766596737206-214abffe65bf', w),
  cook1: (w) => U('1636647511729-6703539ba71f', w),
  cook2: (w) => U('1556911073-52527ac43761', w),
}

const CITY_IMG = {
  Mumbai: '1595658658481-d53d3f999875', 'Navi Mumbai': '1569758267239-d08deb78bb1a', Thane: '1768822854434-c7cefc3b494a',
  Delhi: '1587474260584-136574528ed5', Noida: '1695667424131-a9680e0307ee', Ghaziabad: '1770331373528-1ed0a1af19e6',
  Gurugram: '1787055482226-8544df1e754a', Bengaluru: '1596176530529-78163a4f7af2', Hyderabad: '1696941515998-d83f24967aca', Pune: '1598090216740-eb040d8c3f82',
}
// `custom` is a photo the admin uploaded for the city; otherwise fall back to a stock landmark photo
export const cityImg = (name, w = 700, custom) => custom || U(CITY_IMG[name] || CITY_IMG.Bengaluru, w, Math.round(w * 0.65))
// onError handler: if an uploaded file is missing, swap in the stock photo once instead of showing a broken image
export const imgFallback = (stock) => (e) => { const t = e.currentTarget; if (t.dataset.fb) return; t.dataset.fb = '1'; t.src = stock }
export const CITIES = Object.keys(CITY_IMG)
export const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-')

export const SERVICE_LINKS = [
  { to: '/house-help', label: 'House Help' },
  { to: '/home-cook', label: 'Home Cook' },
  { to: '/bathroom-cleaning', label: 'Bathroom cleaning' },
  { to: '/dishwashing', label: 'Dishwashing' },
  { to: '/fan-cleaning', label: 'Fan cleaning' },
  { to: '/kitchen-cleaning', label: 'Kitchen cleaning' },
]

// icon keys used for the booking services stored in the database
export const SERVICE_PHOTO = {
  broom: IMG.clean1, dishes: IMG.dishes, kitchen: IMG.sink, bath: IMG.bath1, dust: IMG.clean2, fan: IMG.clean3, cook: IMG.cook1, laundry: IMG.laundry,
}

export const SERVICE_PAGES = {
  'house-help': {
    name: 'House Help', pill: 'House Help', hero: IMG.clean1, price: 99,
    sub: 'Book House Help online and get a verified Expert at your door in 10 minutes.',
    heading: 'One House Help Expert to do it all',
    cats: [['broom', 'House cleaning', IMG.mop], ['dishes', 'Dishwashing', IMG.dishes], ['cook', 'Meal prep', IMG.cook2], ['bath', 'Bathroom cleaning', IMG.bath2], ['laundry', 'Laundry & ironing', IMG.laundry], ['dust', 'Dusting & wiping', IMG.clean3]],
    included: ['Sweep and mop accessible floors', 'Dust and wipe furniture and wardrobes', 'Dust reachable walls, fans and ceilings', 'Change or rearrange existing bedding', 'Dispose of wet and dry household waste'],
    excluded: ['Cleaning unsafe or inaccessible areas', 'Any task involving ladders or working at height', 'Moving heavy furniture or appliances', 'Cleaning outside home areas', 'Child, elderly, pet or medical care'],
    why: [['sparkle', 'Regular cleaning matters', 'Consistent cleaning keeps your home hygienic, fresh and free from dust and germs.'], ['badge', 'Trusted and verified', 'Every Expert is background-checked, Aadhaar verified and professionally trained.'], ['clock', 'Hourly based pricing', 'Pay only for what you need. Transparent hourly rates with no hidden fees or commitments.'], ['female', '100% female workforce', 'All our Experts are trained women, trusted by families across India.']],
    about: ['House Help on Clickit: an already-trained, verified Expert at your door in about 10 minutes, booked by the hour from ₹99.', 'Clickit brings House Help on demand. In one booking an Expert takes care of sweeping, mopping and dusting, dishwashing, bathroom and kitchen cleaning, laundry help and basic kitchen prep. Book from 30 minutes to 4 hours and pay only for the time you use.'],
    faq: ['In which cities is House Help available?', 'How is House Help priced on Clickit?', 'What is included in the service?', 'How can I trust the experts sent by Clickit?', 'What if I need to cancel or reschedule my booking?'],
  },
  'home-cook': {
    name: 'Home Cook', pill: 'Home Cook', hero: IMG.cook1, price: 249,
    sub: 'Fresh home-style meals, cooked in your own kitchen by a trained Expert.',
    heading: 'One Home Cook to make every meal easy',
    cats: [['cook', 'Daily meals', IMG.cook2], ['kitchen', 'Meal prep', IMG.food], ['dishes', 'Utensil cleanup', IMG.dishes2], ['sparkle', 'Party help', IMG.cook1]],
    included: ['Breakfast, dal, sabzi, rice and breads from the in-app menu', 'Chopping, prep and basic cooking for 1 to 4 people', 'Cleaning of the utensils used while cooking', 'Wiping the cooking platform after the session'],
    excluded: ['Arranging groceries and ingredients', 'Dishes that are not on the menu', 'Deep cleaning of the kitchen', 'Catering for large gatherings'],
    why: [['cook', 'Cooked fresh at home', 'Your ingredients, your kitchen, your taste. Meals are made the way your family likes.'], ['badge', 'Trained and verified', 'Every Expert is background-checked, Aadhaar verified and trained for kitchen hygiene.'], ['clock', 'Priced by the hour', 'One hour typically covers up to 3 dishes for 1 to 2 people.'], ['calendar', 'Flexible slots', 'Book instantly or schedule daily and weekly cooking sessions.']],
    about: ['Home Cook on Clickit: a trained cook in your kitchen, booked by the hour.', 'Pick dishes from the menu, share a time and your Expert arrives with everything but the ingredients. Sessions start with an OTP and end with a tidy kitchen.'],
    faq: ['What can the Home Cook make?', 'Do I need to arrange ingredients?', 'How do I select the right duration?', 'What are the working hours?', 'Can I book a Home Cook for a party?'],
  },
  'bathroom-cleaning': {
    name: 'Bathroom Cleaning', pill: 'Bathroom Cleaning', hero: IMG.bath1, price: 199,
    sub: 'Spotless, fresh bathrooms by trained Experts in as little as 60 minutes.',
    heading: 'Every corner of your bathroom, handled',
    cats: [['bath', 'Floor and tiles', IMG.bath2], ['sparkle', 'Mirrors and glass', IMG.bath3], ['broom', 'Sink and taps', IMG.bath1], ['dust', 'Exhaust and walls', IMG.clean2]],
    included: ['Scrub floors and wall tiles within reach', 'Clean the washbasin, taps and fittings', 'Clean the toilet seat and bowl', 'Wipe mirrors, shelves and glass', 'Dispose of bathroom waste'],
    excluded: ['Tile grout repair or re-sealing', 'Plumbing or drainage work', 'Cleaning above reachable height', 'Pest control'],
    why: [['sparkle', 'Hygiene first', 'Dedicated tools and trained methods keep bathrooms fresh and germ free.'], ['badge', 'Trusted and verified', 'Every Expert is background-checked and Aadhaar verified.'], ['clock', 'Fast and on time', 'An Expert reaches you in minutes with instant booking.'], ['rupee', 'Honest pricing', 'See the exact price before you confirm. No hidden charges.']],
    about: ['Bathroom cleaning on Clickit starts at ₹199 for 60 minutes.', 'Your Expert focuses on floors, tiles, fittings, mirrors and the toilet, using supplies you provide, so the result matches your preferences.'],
    faq: ['Does the Expert bring cleaning materials?', 'What is included in the service?', 'How long does bathroom cleaning take?', 'Is deep cleaning offered?', 'What if I need to cancel or reschedule?'],
  },
  dishwashing: {
    name: 'Dishwashing', pill: 'Dishwashing', hero: IMG.dishes, price: 99,
    sub: 'Utensils cleaned, rinsed and neatly arranged in 30 minutes.',
    heading: 'Dishwashing without the daily chore',
    cats: [['dishes', 'Utensils cleaning', IMG.dishes2], ['kitchen', 'Sink cleanup', IMG.sink], ['sparkle', 'Platform wipe', IMG.clean2], ['cook', 'After party cleanup', IMG.food]],
    included: ['Wash and rinse all utensils', 'Clean the sink and drain area', 'Arrange utensils on the rack', 'Wipe the kitchen platform'],
    excluded: ['Cleaning of heavily burnt cookware beyond the booked time', 'Dishwasher loading and unloading', 'Cleaning of appliances', 'Disposal of food waste outside the home'],
    why: [['dishes', 'Spotless utensils', 'Trained Experts wash every utensil the way you want it.'], ['badge', 'Trusted and verified', 'Every Expert is background-checked and Aadhaar verified.'], ['clock', 'Start from 30 minutes', 'Book a short slot, pay only for the time you need.'], ['calendar', 'Daily bookings', 'Schedule recurring slots after every meal.']],
    about: ['Dishwashing on Clickit starts at ₹99 for 30 minutes.', 'Choose instant or scheduled help and your Expert takes care of the rest, including the sink and platform.'],
    faq: ['Does the Expert bring dishwashing supplies?', 'How long does it take?', 'Can I book daily dishwashing?', 'What if the Expert is late?', 'How do I pay?'],
  },
  'fan-cleaning': {
    name: 'Fan Cleaning', pill: 'Fan Cleaning', hero: IMG.clean3, price: 129,
    sub: 'Dust-free ceiling and wall fans, cleaned safely by trained Experts.',
    heading: 'Fans that look and run like new',
    cats: [['fan', 'Ceiling fans', IMG.clean3], ['dust', 'Wall fans', IMG.clean2], ['sparkle', 'Blades and motor cover', IMG.clean1], ['broom', 'Floor cleanup', IMG.mop]],
    included: ['Wipe all blades and the motor cover', 'Clean the fan rod and canopy within reach', 'Floor cleanup after dusting'],
    excluded: ['Work that needs ladders above a safe height', 'Electrical repair or fan servicing', 'Removal of fan blades'],
    why: [['fan', 'Better airflow', 'Clean blades move air efficiently and reduce dust in the room.'], ['badge', 'Trusted and verified', 'Every Expert is background-checked and Aadhaar verified.'], ['clock', 'Quick sessions', 'Most homes are done in under an hour.'], ['rupee', 'Honest pricing', 'See the price before you book.']],
    about: ['Fan cleaning on Clickit starts at ₹129.', 'Experts clean fans within safe reach and leave your room tidy. For work at height, we recommend a specialist.'],
    faq: ['How many fans can be cleaned in one booking?', 'Is a ladder used?', 'Does it include the floor cleanup?', 'How do I book?', 'What if I need to cancel?'],
  },
  'kitchen-cleaning': {
    name: 'Kitchen Cleaning', pill: 'Kitchen Cleaning', hero: IMG.sink, price: 199,
    sub: 'A tidy, hygienic kitchen after every busy day.',
    heading: 'A kitchen you will love to cook in',
    cats: [['kitchen', 'Platform and sink', IMG.sink], ['dishes', 'Utensils', IMG.dishes], ['broom', 'Floor and tiles', IMG.mop], ['sparkle', 'Cabinet exteriors', IMG.clean2]],
    included: ['Wipe the cooking platform and backsplash', 'Clean the sink and tap', 'Wipe cabinet exteriors and handles', 'Sweep and mop the kitchen floor'],
    excluded: ['Chimney and gas stove deep cleaning', 'Appliance interior cleaning', 'Pest control', 'Cleaning above reachable height'],
    why: [['kitchen', 'Fresh and hygienic', 'Daily wipe downs keep grease and germs from building up.'], ['badge', 'Trusted and verified', 'Every Expert is background-checked and Aadhaar verified.'], ['clock', 'Hourly based pricing', 'Pay only for the hours you book.'], ['female', '100% female workforce', 'All our Experts are trained women, trusted by families across India.']],
    about: ['Kitchen cleaning on Clickit starts at ₹199 for 60 minutes.', 'Your Expert focuses on the platform, sink, cabinets and floor. Pair it with Dishwashing for a complete kitchen reset.'],
    faq: ['What is included in kitchen cleaning?', 'Is chimney cleaning included?', 'Does the Expert bring supplies?', 'How long does it take?', 'What if I need to reschedule?'],
  },
}

export const FAQS = {
  'What is Clickit?': 'Clickit connects you with trained, verified professionals for everyday home tasks within minutes.',
  'What is included in the service?': 'Everyday household tasks such as cleaning, dishwashing, dusting and basic meal prep, within the booked duration.',
  'How do I book services?': 'Choose a service, pick a duration and confirm your address. The nearest available Expert is notified instantly and can accept your request.',
  'Are your Experts trusted?': 'Every Expert goes through ID verification, background checks and training, and is approved by our admin team before taking a booking.',
  'In which cities is House Help available?': 'Clickit is live in Mumbai and Delhi, with more cities and areas added regularly. Each city has Experts working close to your neighbourhood.',
  'How is House Help priced on Clickit?': 'Pricing is hourly, starting from ₹99. The final price is always shown before you confirm.',
  'How can I trust the experts sent by Clickit?': 'Experts are background-checked, Aadhaar verified and trained. Every job includes before and after photos so you can see the work.',
  'What if I need to cancel or reschedule my booking?': 'You can cancel from My Bookings before an Expert starts the job. Charges, if any, are shown first.',
  'What can the Home Cook make?': 'A range of breakfast items, dal, sabzi, rice, breads and more. See the in-app menu.',
  'Do I need to arrange ingredients?': 'Yes, keep ingredients ready before the Expert arrives.',
  'How do I select the right duration?': 'One hour typically covers up to 3 dishes for 1 to 2 people.',
  'What are the working hours?': 'Experts are available from 6 AM to 8 PM depending on local availability.',
  'Can I book a Home Cook for a party?': 'Yes, for up to 10 people for up to 4 hours. Larger groups need multiple bookings.',
  'Does the Expert bring cleaning materials?': 'No. You provide the supplies, so the result matches your preferences.',
  'How long does bathroom cleaning take?': 'A standard bathroom takes about 60 minutes.',
  'Is deep cleaning offered?': 'Clickit focuses on everyday cleaning. Deep or specialised cleaning is not included.',
  'Does the Expert bring dishwashing supplies?': 'No. Please keep dish soap and scrubbers ready.',
  'How long does it take?': 'Most dishwashing sessions take 30 minutes.',
  'Can I book daily dishwashing?': 'Yes, use Schedule with a date range or pick custom days.',
  'What if the Expert is late?': 'You can cancel for free if the Expert is more than 30 minutes late.',
  'How do I pay?': 'You pay online after the booking is confirmed. The price is shown upfront.',
  'How many fans can be cleaned in one booking?': 'Typically 3 to 4 fans per hour, depending on size and height.',
  'Is a ladder used?': 'Experts clean within safe reach. Tasks needing ladders at height are not included.',
  'Does it include the floor cleanup?': 'Yes, the area under the fan is wiped after dusting.',
  'How do I book?': 'Choose the service, pick a time and confirm your address.',
  'What if I need to cancel?': 'Cancel from My Bookings before the Expert starts the job.',
  'What is included in kitchen cleaning?': 'Platform, sink, cabinet exteriors and floor cleaning.',
  'Is chimney cleaning included?': 'No. Chimney and stove deep cleaning are not part of this service.',
  'Does the Expert bring supplies?': 'No. Please keep cleaning supplies ready.',
  'What if I need to reschedule?': 'Reschedule from My Bookings before the booking starts.',
}
export const FAQ_GROUPS = [
  ['Booking', ['How do I book services?', 'What is included in the service?', 'Does the Expert bring cleaning materials?', 'How do I select the right duration?']],
  ['Payment', ['How is House Help priced on Clickit?', 'How do I pay?']],
  ['Safety', ['Are your Experts trusted?', 'How can I trust the experts sent by Clickit?']],
  ['Cancellation', ['What if I need to cancel or reschedule my booking?', 'What if the Expert is late?']],
  ['General', ['What is Clickit?', 'In which cities is House Help available?', 'Is deep cleaning offered?']],
  ['Home Cook', ['What can the Home Cook make?', 'Do I need to arrange ingredients?', 'What are the working hours?', 'Can I book a Home Cook for a party?']],
]

export const REVIEWS = [
  ['A very good attitude and a pleasing personality. She finished everything even after the time was up.', 'Riya G.', 'Mumbai'],
  ['Excellent work. I would book her again without a second thought.', 'Reshma K.', 'Delhi'],
  ['Perfect in her work and goes the extra mile to finish the job.', 'Shubham S.', 'Thane'],
  ['Super quick and cleaned every corner. Definitely recommend.', 'Akash N.', 'Noida'],
  ['Humble and does a very good job without even being told.', 'Monika T.', 'Gurugram'],
  ['She pays attention to detail and leaves everything spotless.', 'Shilpa A.', 'Pune'],
  ['Dedicated and thorough. Our home has never looked cleaner.', 'Mayank R.', 'Delhi'],
  ['Quick and flexible, even while the kids were playing around.', 'Viraj P.', 'Navi Mumbai'],
]

export const BLOG_CATS = ['All', 'Home Cleaning', 'Kitchen Prep', 'Family Living', 'Costs & Pricing']
export const POSTS = [
  { slug: 'full-time-vs-part-time-vs-on-demand-house-help', title: 'Full-Time vs Part-Time vs On-Demand House Help: Real Cost Comparison', cat: 'Costs & Pricing', date: 'Oct 12, 2026', img: IMG.heroA, excerpt: 'A clear look at what each hiring model really costs a family each month.',
    body: ['Hiring house help usually means choosing between three models: a full-time helper, a part-time helper who visits on a schedule, or on-demand help booked by the hour.', 'Full-time help offers constant availability but comes with a fixed monthly salary, leave management and, often, accommodation expectations. Part-time help reduces cost but still ties you to fixed visiting hours.', 'On-demand help, booked by the hour, is the most flexible option. You pay only for the time you use, which suits small households and busy weeks. Add up your weekly hours before deciding.'] },
  { slug: 'house-help-salary-in-india', title: 'House Help Salary in India: City-Wise Monthly Ranges', cat: 'Costs & Pricing', date: 'Oct 8, 2026', img: IMG.clean2, excerpt: 'What households pay across metros, and what shapes the number.',
    body: ['Salaries vary by city, the number of tasks and the number of hours worked.', 'Metros such as Mumbai and Delhi sit at the higher end of the range, while tier-two cities cost less. Tasks like cooking command a premium over basic cleaning.', 'Comparing the monthly cost with hourly booking helps you decide whether a fixed arrangement is worth it.'] },
  { slug: 'how-much-does-house-cleaning-cost-in-india', title: 'How Much Does House Cleaning Cost in India?', cat: 'Costs & Pricing', date: 'Oct 3, 2026', img: IMG.mop, excerpt: 'Hourly rates, home size and what is included.',
    body: ['House cleaning is usually priced by the hour or by home size.', 'A standard sweep, mop and dust for a 2 BHK takes around 60 to 90 minutes. Hourly booking keeps the price transparent.', 'Always check what is included before you book so you can match the duration to your home.'] },
  { slug: 'how-to-clean-a-bathroom', title: 'How to Clean a Bathroom: Step-by-Step Guide and Checklist', cat: 'Home Cleaning', date: 'Sep 28, 2026', img: IMG.bath1, excerpt: 'A simple routine that leaves every surface fresh.',
    body: ['Start from the top. Wipe the exhaust fan cover, tiles and mirror before moving down to the sink and toilet.', 'Let the cleaner sit for a few minutes on stains, then scrub with a brush and rinse thoroughly. Always ventilate while using strong cleaners.', 'Finish with the floor, working towards the door so you do not walk on wet tiles.'] },
  { slug: 'how-to-clean-a-ceiling-fan-safely', title: 'How to Clean a Ceiling Fan Safely: Step-by-Step', cat: 'Home Cleaning', date: 'Sep 21, 2026', img: IMG.clean3, excerpt: 'Dust-free blades without the mess.',
    body: ['Switch the fan off and let it stop completely. Use a stable step stool and keep one hand free for balance.', 'Slip an old pillowcase over each blade and pull it back to trap the dust inside. Wipe with a damp cloth to finish.', 'Never lean from a chair. If your fan is above a safe height, hire someone equipped for it.'] },
  { slug: 'how-to-clean-a-kitchen-chimney-and-gas-stove', title: 'How to Clean a Kitchen Chimney and Gas Stove', cat: 'Kitchen Prep', date: 'Sep 14, 2026', img: IMG.sink, excerpt: 'Remove grease build-up the safe way.',
    body: ['Disconnect the gas supply and let the stove cool. Remove burners and grates and soak them in hot soapy water.', 'Wipe the stovetop with a degreaser, paying attention to the corners. Use a soft brush for burner holes.', 'Chimney filters should be cleaned every few weeks in homes that cook daily.'] },
  { slug: 'meal-prep-for-busy-families', title: 'Meal Prep for Busy Families: A Weekly Plan', cat: 'Family Living', date: 'Sep 7, 2026', img: IMG.cook1, excerpt: 'Spend one hour to save a whole week.',
    body: ['Choose three base items such as a dal, a dry sabzi and a grain. Chop and portion ingredients once.', 'Store prepped vegetables in airtight containers and label them with the day.', 'A short weekly session with a helper makes weekday cooking far faster.'] },
  { slug: 'cook-and-kitchen-help-cost-in-india', title: 'Cook and Kitchen Help Cost in India: What You Will Pay', cat: 'Costs & Pricing', date: 'Aug 30, 2026', img: IMG.cook2, excerpt: 'Hourly and monthly costs compared.',
    body: ['Cooks are priced by dishes, people served and time. Hourly booking works well for one or two meals a day.', 'A monthly arrangement can look cheaper but adds leave and substitute costs.', 'Compare based on how many hours per week you actually need.'] },
  { slug: 'keeping-a-home-tidy-with-kids', title: 'Keeping a Home Tidy with Kids: 8 Small Habits', cat: 'Family Living', date: 'Aug 22, 2026', img: IMG.clean2, excerpt: 'Small routines that keep clutter from piling up.',
    body: ['Give every toy a home, even if it is only a basket by the door.', 'Set a ten minute tidy time before dinner. Make it a game and the whole family joins in.', 'Book short weekly cleaning help for the tasks that need more time.'] },
]

export const LEGAL = {
  'terms-and-conditions': { title: 'Terms & Conditions', sections: [
    ['Using Clickit', 'By creating an account or booking a service you agree to these terms. You must provide accurate details and be at least 18 years old.'],
    ['Bookings', 'A booking is confirmed when an Expert accepts your request. Experts arrive within the estimated time, subject to traffic and availability.'],
    ['Pricing and payment', 'Prices are shown before confirmation and depend on duration and city. You agree to pay the displayed amount for completed services.'],
    ['Conduct', 'Please treat Experts with respect. Tasks that are unsafe, require work at height or involve care of people or pets are not covered.'],
    ['Liability', 'Clickit works to ensure quality and safety. Our liability is limited to the value of the affected booking, to the extent permitted by law.'],
  ] },
  'privacy-policy': { title: 'Privacy Policy', sections: [
    ['What we collect', 'We collect your name, phone number, address and booking history to provide the service. Experts additionally provide identity documents for verification.'],
    ['How we use it', 'We use your data to match Experts, process bookings, improve service quality and keep our platform safe.'],
    ['Photos', 'Experts upload before and after photos of completed jobs. They are visible to you and our admin team.'],
    ['Sharing', 'We share only the details an Expert needs to reach and serve you. We do not sell your personal data.'],
    ['Your choices', 'You can ask us to correct or delete your data by writing to help@clickit.com.'],
  ] },
  'refund-and-cancellation': { title: 'Refund & Cancellation', sections: [
    ['Cancelling a booking', 'You can cancel before the Expert starts the job from My Bookings. Late cancellations after an Expert has started travelling may attract a fee.'],
    ['Refunds', 'If no Expert arrives, the Expert is more than 30 minutes late, or the work does not meet the standard, we will refund the affected booking.'],
    ['How long refunds take', 'Wallet refunds are instant. Other payment methods take 7 to 10 business days.'],
    ['Contact', 'Write to help@clickit.com with your booking ID and we will help.'],
  ] },
}

// professional portraits for the team section (face-cropped square)
export const portrait = (id, w = 600) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&crop=faces&w=${w}&h=${w}&q=75`
export const TEAM = [
  ['Aarav Mehta', 'Founder & CEO', 'Mumbai', '1600878459138-e1123b37cb30'],
  ['Neha Kapoor', 'Head of Operations', 'Delhi', '1758518729466-827cd8293992'],
  ['Rohan Iyer', 'Technology', 'Mumbai', '1656221010175-bcfeadcb6017'],
  ['Isha Verma', 'People & Culture', 'Delhi', '1768221677463-191fc4e15690'],
  ['Kabir Shah', 'Trust & Safety', 'Mumbai', '1584554376766-ac0f2c65e949'],
  ['Meera Joshi', 'Legal & Compliance', 'Mumbai', '1758518729459-235dcaadc611'],
  ['Vikram Singh', 'Business Development', 'Delhi', '1656221007870-dbb3900d6d99'],
  ['Ananya Rao', 'Brand & Growth', 'Delhi', '1758600587839-56ba05596c69'],
  ['Pooja Nair', 'Customer Support', 'Mumbai', '1637589267610-6c66fc2a086b'],
  ['Riya Malhotra', 'Expert Training', 'Delhi', '1659355894139-ca46ea6fa67a'],
]
