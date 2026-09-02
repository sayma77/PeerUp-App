// scripts/seed.js
//
// Firestore equivalent of your old seed.js. This runs as a plain Node
// script OUTSIDE the Expo app (uses firebase-admin, which bypasses
// security rules entirely — never bundle this into the app itself).
//
// SETUP (one-time):
// 1. npm install firebase-admin --save-dev
// 2. Firebase Console → Project Settings → Service Accounts →
//    "Generate new private key" → save the downloaded JSON as
//    scripts/serviceAccountKey.json
// 3. Add scripts/serviceAccountKey.json to .gitignore — it's a live
//    admin credential for your whole Firebase project, treat it like
//    a password.
//
// RUN: node scripts/seed.js

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const serviceAccount = require("./serviceAccountKey.json");

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

const sampleNames = [
  "Sayma Akter", "Sadia Ishrat", "Sarah Chen", "Marcus Jordan", "Elena Rodriguez",
  "Hiroshi Tanaka", "Maya Patel", "Liam Wilson", "Chloe Dubois", "Jordan Smith",
  "Fatima Al-Sayed", "Oliver Brown", "Sophia Kim", "Lucas Meyer", "Isabella Garcia",
  "Noah Wright", "Wafeea Anisha",
];

// category values match your types/skills.ts CATEGORIES, not the old
// Mongoose enum — update this list if you settle on different category
// names (see the mismatch flagged earlier).
const sampleSkills = [
  { name: "Web Development", category: "Tech", description: "Master HTML, CSS, and modern JavaScript frameworks like React." },
  { name: "Motion Graphics", category: "Creative", description: "Create stunning visual effects and animations using After Effects." },
  { name: "UI/UX Design", category: "Creative", description: "Learn user-centric design principles and prototyping tools like Figma." },
  { name: "Mandarin Chinese", category: "Languages", description: "Practice conversational Mandarin with native speakers." },
  { name: "Data Science", category: "Tech", description: "Analyze complex datasets using Python, R, and Machine Learning." },
  { name: "Brand Strategy", category: "Business", description: "Build cohesive brand identities and market positioning strategies." },
  { name: "Spanish", category: "Languages", description: "From basics to advanced grammar and fluid conversation." },
  { name: "Digital Marketing", category: "Business", description: "Master SEO, SEM, and social media growth hacking." },
  { name: "Photography", category: "Creative", description: "Learn composition, lighting, and professional editing." },
  { name: "Video Editing", category: "Creative", description: "Edit professional videos using Premiere Pro and DaVinci Resolve." },
  { name: "Public Speaking", category: "Business", description: "Build confidence and deliver compelling presentations to any audience." },
  { name: "Machine Learning", category: "Tech", description: "Build and train ML models using TensorFlow, PyTorch, and scikit-learn." },
];

// Resources per skill: [title, link, description, level]
const sampleResources = {
  "Web Development": [
    { title: "The Odin Project", link: "https://www.theodinproject.com", description: "A free full-stack curriculum covering HTML, CSS, JavaScript, and more.", level: "Beginner" },
    { title: "JavaScript.info", link: "https://javascript.info", description: "A modern and comprehensive guide to JavaScript from basics to advanced topics.", level: "Medium" },
    { title: "React Official Docs", link: "https://react.dev", description: "The official React documentation with interactive examples and deep dives.", level: "Medium" },
    { title: "Frontend Masters", link: "https://frontendmasters.com", description: "Expert-led courses on advanced frontend architecture and performance.", level: "Hard" },
  ],
  "Motion Graphics": [
    { title: "School of Motion", link: "https://www.schoolofmotion.com", description: "Industry-leading courses on After Effects, Cinema 4D, and motion design principles.", level: "Medium" },
    { title: "Motion Design School", link: "https://motiondesign.school", description: "Structured learning paths for aspiring motion designers.", level: "Beginner" },
    { title: "Mobox Graphics YouTube", link: "https://www.youtube.com/@moboxgraphics", description: "Free After Effects tutorials covering everything from basics to advanced techniques.", level: "Beginner" },
  ],
  "UI/UX Design": [
    { title: "Figma Learn", link: "https://www.figma.com/resource-library/", description: "Official Figma resources and tutorials to master the tool.", level: "Beginner" },
    { title: "Nielsen Norman Group Articles", link: "https://www.nngroup.com/articles/", description: "Research-based UX insights and usability guidelines from industry experts.", level: "Medium" },
    { title: "Google UX Design Certificate", link: "https://grow.google/certificates/ux-design/", description: "A structured program covering the full UX design process.", level: "Beginner" },
    { title: "UX Collective", link: "https://uxdesign.cc", description: "In-depth articles and case studies on advanced UX strategy and systems thinking.", level: "Hard" },
  ],
  "Mandarin Chinese": [
    { title: "HelloChinese", link: "https://www.hellochinese.cc", description: "A beginner-friendly app for learning Mandarin with structured lessons.", level: "Beginner" },
    { title: "HSK Online", link: "https://www.hskonline.com", description: "Practice resources aligned with the HSK proficiency exam levels.", level: "Medium" },
    { title: "ChinesePod", link: "https://chinesepod.com", description: "Podcast-style lessons for intermediate to advanced Mandarin learners.", level: "Hard" },
  ],
  "Data Science": [
    { title: "Kaggle Learn", link: "https://www.kaggle.com/learn", description: "Free micro-courses on Python, Pandas, machine learning, and data visualization.", level: "Beginner" },
    { title: "Towards Data Science", link: "https://towardsdatascience.com", description: "Community-driven articles covering data science concepts and real-world projects.", level: "Medium" },
    { title: "Fast.ai", link: "https://www.fast.ai", description: "A top-down practical approach to deep learning for practitioners.", level: "Hard" },
  ],
  "Brand Strategy": [
    { title: "Brand New Blog", link: "https://www.underconsideration.com/brandnew/", description: "A critique blog reviewing brand identity work from around the world.", level: "Beginner" },
    { title: "Marty Neumeier \u2013 The Brand Gap", link: "https://www.amazon.com/Brand-Gap-Distance-Business-Strategy/dp/0321348109", description: "A seminal book bridging the gap between business strategy and design.", level: "Medium" },
    { title: "Harvard Business Review \u2013 Branding", link: "https://hbr.org/topic/subject/branding", description: "Advanced case studies on brand positioning, equity, and management.", level: "Hard" },
  ],
};

// Firestore has no bulk deleteMany — delete docs in a collection in
// batches instead. Fine at this data size (small seed set).
async function clearCollection(name) {
  const snap = await db.collection(name).get();
  if (snap.empty) return;
  const batch = db.batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  console.log(`Cleared ${snap.size} docs from ${name}`);
}

async function seed() {
  try {
    // Clear collections this script owns. Requests/Reviews/Notifications
    // aren't seeded yet (no sample data for them below), so they're left
    // alone here — add clearing + sample data for each as we build those
    // features.
    await clearCollection("resources");
    await clearCollection("skills");
    await clearCollection("users");
    // NOTE: this only deletes the top-level class docs, not their
    // registrants/questions/reviews subcollections — Admin SDK doesn't
    // cascade-delete subcollections automatically. Fine for repeated dev
    // seeding at this scale; if it ever matters, delete subcollection
    // docs explicitly before deleting the parent.
    await clearCollection("classes");
    // Same subcollection caveat doesn't apply here — projects have no
    // subcollections, joinRequests live as an embedded array field.
    await clearCollection("projects");
    console.log("Cleared existing seed data...");

    // ── Users ────────────────────────────────────────────────────────
    // These are Firestore-only profile docs, NOT Firebase Auth accounts
    // — you can't log in as them. They exist purely so mentor detail
    // views, skill cards, etc. have real user data to display. Use your
    // own real registered account to test the requester side of things.
    const usersRef = db.collection("users");
    const createdUsers = [];
    for (const fullName of sampleNames) {
      const [first, last] = fullName.split(" ");
      const docRef = usersRef.doc(); // auto-generated ID, stands in for a uid
      const userData = {
        name: fullName,
        username: (first + last).toLowerCase(),
        email: `${first.toLowerCase()}@mail.com`,
        avatar: "",
        intro: "",
        bio: "",
        rating: 0,
        reviewCount: 0,
        pinnedBadges: [],
        createdAt: FieldValue.serverTimestamp(),
      };
      await docRef.set(userData);
      createdUsers.push({ id: docRef.id, ...userData });
    }
    console.log(`Created ${createdUsers.length} users...`);

    // ── Skills ───────────────────────────────────────────────────────
    const skillsRef = db.collection("skills");
    const createdSkills = [];
    for (let i = 0; i < sampleSkills.length; i++) {
      const skill = sampleSkills[i];
      const mentor = createdUsers[i % createdUsers.length];
      const docRef = skillsRef.doc();
      const skillData = {
        name: skill.name,
        category: skill.category,
        description: skill.description,
        mentorId: mentor.id,
        mentorName: mentor.name,
        createdAt: FieldValue.serverTimestamp(),
      };
      await docRef.set(skillData);
      createdSkills.push({ id: docRef.id, ...skillData });
    }
    console.log(`Created ${createdSkills.length} skills...`);

    // ── Resources ────────────────────────────────────────────────────
    const resourcesRef = db.collection("resources");
    let resourceCount = 0;
    for (let i = 0; i < createdSkills.length; i++) {
      const skill = createdSkills[i];
      const resources = sampleResources[skill.name] || [];
      const addedBy = createdUsers[(i + 1) % createdUsers.length];

      for (const r of resources) {
        await resourcesRef.add({
          skillId: skill.id,
          skillName: skill.name,
          addedBy: addedBy.id,
          title: r.title,
          link: r.link,
          description: r.description,
          level: r.level,
          createdAt: FieldValue.serverTimestamp(),
        });
        resourceCount++;
      }
    }
    console.log(`Created ${resourceCount} resources...`);

    // ── Classes (Live Classrooms) ───────────────────────────────────
    // Timestamp import for hand-rolled dates (past/future), separate from
    // FieldValue.serverTimestamp() which is only for createdAt fields.
    const { Timestamp } = require("firebase-admin/firestore");
    const now = Date.now();
    const hours = (n) => n * 60 * 60 * 1000;
    const days = (n) => n * 24 * hours(1);

    const sampleClasses = [
      {
        title: "React Native Basics: Building Your First Screen",
        topicTags: ["Tech"],
        mentor: createdUsers[0],
        scheduledAt: new Date(now - hours(1)), // started an hour ago
        maxCapacity: 30,
        registeredCount: 18,
        platform: "Google Meet",
        conferenceLink: "https://meet.google.com/abc-defg-hij",
        status: "live",
        slidesUrl: "",
        repoUrl: "",
      },
      {
        title: "Intro to UI Design Systems",
        topicTags: ["Creative"],
        mentor: createdUsers[2],
        scheduledAt: new Date(now + days(1)),
        maxCapacity: 20,
        registeredCount: 6,
        platform: "Zoom",
        conferenceLink: "https://zoom.us/j/1234567890",
        status: "upcoming",
        slidesUrl: "",
        repoUrl: "",
      },
      {
        title: "Guitar Chords for Beginners",
        topicTags: ["Creative"],
        mentor: createdUsers[6],
        scheduledAt: new Date(now + days(2)),
        maxCapacity: 15,
        registeredCount: 15,
        platform: "Discord",
        conferenceLink: "https://discord.gg/example",
        status: "upcoming",
        slidesUrl: "",
        repoUrl: "",
      },
      {
        title: "Conversational Spanish Practice",
        topicTags: ["Languages"],
        mentor: createdUsers[3],
        scheduledAt: new Date(now + days(4)),
        maxCapacity: 12,
        registeredCount: 3,
        platform: "Google Meet",
        conferenceLink: "https://meet.google.com/spanish-practice",
        status: "upcoming",
        slidesUrl: "",
        repoUrl: "",
      },
      {
        title: "Pitch Deck Teardown",
        topicTags: ["Business"],
        mentor: createdUsers[10],
        scheduledAt: new Date(now - days(10)),
        maxCapacity: 25,
        registeredCount: 22,
        platform: "MS Teams",
        conferenceLink: "https://teams.microsoft.com/example",
        status: "completed",
        slidesUrl: "https://example.com/pitch-deck-slides",
        repoUrl: "",
      },
    ];

    const classesRef = db.collection("classes");
    let classCount = 0;
    for (const c of sampleClasses) {
      const docRef = classesRef.doc();
      await docRef.set({
        title: c.title,
        topicTags: c.topicTags,
        mentorId: c.mentor.id,
        mentorName: c.mentor.name,
        scheduledAt: Timestamp.fromDate(c.scheduledAt),
        maxCapacity: c.maxCapacity,
        registeredCount: c.registeredCount,
        platform: c.platform,
        conferenceLink: c.conferenceLink,
        status: c.status,
        slidesUrl: c.slidesUrl,
        repoUrl: c.repoUrl,
        createdAt: FieldValue.serverTimestamp(),
      });

      // A couple of sample discussion questions on the completed class,
      // so the Discussion section has something to show right away.
      if (c.status === "completed") {
        const questionsRef = docRef.collection("questions");
        const asker1 = createdUsers[1];
        const asker2 = createdUsers[4];
        await questionsRef.add({
          authorId: asker1.id,
          authorName: asker1.name,
          text: "Will the slides be shared after the session?",
          upvotes: 4,
          upvotedBy: [asker1.id, asker2.id],
          createdAt: FieldValue.serverTimestamp(),
        });
        await questionsRef.add({
          authorId: asker2.id,
          authorName: asker2.name,
          text: "Any tips for structuring the problem statement slide?",
          upvotes: 2,
          upvotedBy: [asker2.id],
          createdAt: FieldValue.serverTimestamp(),
        });
      }

      classCount++;
    }
    console.log(`Created ${classCount} classes...`);

    // ── Projects (Collaborative Projects feature) ───────────────────
    // These are seed-only sample projects for browsing/UI testing. To
    // test the join-request flow end-to-end with your own real accounts
    // (not these seed users, since they have no Auth login), create a
    // project from one logged-in account and send/accept a join request
    // from a second logged-in account.
    const sampleProjects = [
      {
        title: "Campus Marketplace App",
        description:
          "A React Native app for students to buy/sell used textbooks and gear on campus.",
        status: "open",
        creator: createdUsers[0],
        members: [createdUsers[0]],
        maxMembers: 4,
        skillsRequired: ["React Native", "Firebase", "UI Design"],
        joinRequests: [
          {
            userId: createdUsers[8].id,
            username: createdUsers[8].username,
            userName: createdUsers[8].name,
            status: "declined",
          },
        ],
      },
      {
        title: "Study Group Finder",
        description:
          "Match students into study groups based on course and availability.",
        status: "in-progress",
        creator: createdUsers[3],
        members: [createdUsers[3], createdUsers[0]],
        maxMembers: 3,
        skillsRequired: ["Node.js", "MongoDB"],
        joinRequests: [],
      },
      {
        title: "Alumni Mentorship Portal",
        description:
          "Connect current students with alumni mentors in their field.",
        status: "completed",
        creator: createdUsers[4],
        members: [createdUsers[4], createdUsers[5]],
        maxMembers: 2,
        skillsRequired: ["EJS", "Express"],
        joinRequests: [],
      },
    ];

    const projectsRef = db.collection("projects");
    let projectCount = 0;
    for (const p of sampleProjects) {
      const toMember = (u) => ({id: u.id, name: u.name, username: u.username});
      await projectsRef.add({
        title: p.title,
        description: p.description,
        status: p.status,
        creator: toMember(p.creator),
        members: p.members.map(toMember),
        maxMembers: p.maxMembers,
        skillsRequired: p.skillsRequired,
        joinRequests: p.joinRequests,
        createdAt: FieldValue.serverTimestamp(),
      });
      projectCount++;
    }
    console.log(`Created ${projectCount} projects...`);

    console.log("Seeding complete!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();