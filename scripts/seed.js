// scripts/seed.js
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore, FieldValue, Timestamp } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const serviceAccount = require("./serviceAccountKey.json");

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();
const auth = getAuth();

// Default password for all seeded accounts
const SEED_USER_PASSWORD = "Password123!";

const sampleNames = [
  "Sayma Akter", "Sadia Ishrat", "Sarah Chen", "Marcus Jordan", "Elena Rodriguez",
  "Hiroshi Tanaka", "Maya Patel", "Liam Wilson", "Chloe Dubois", "Jordan Smith",
  "Fatima Al-Sayed", "Oliver Brown", "Sophia Kim", "Lucas Meyer", "Isabella Garcia",
  "Noah Wright", "Wafeea Anisha",
];

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
    { title: "Marty Neumeier – The Brand Gap", link: "https://www.amazon.com/Brand-Gap-Distance-Business-Strategy/dp/0321348109", description: "A seminal book bridging the gap between business strategy and design.", level: "Medium" },
    { title: "Harvard Business Review – Branding", link: "https://hbr.org/topic/subject/branding", description: "Advanced case studies on brand positioning, equity, and management.", level: "Hard" },
  ],
};

async function clearCollection(name) {
  const snap = await db.collection(name).get();
  if (snap.empty) return;
  const batch = db.batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  console.log(`Cleared ${snap.size} docs from ${name}`);
}

// Clean up existing Auth users for the seed emails to avoid duplicate errors
async function clearAuthUsersByEmail(emails) {
  let deletedCount = 0;
  for (const email of emails) {
    try {
      const user = await auth.getUserByEmail(email);
      await auth.deleteUser(user.uid);
      deletedCount++;
    } catch (err) {
      if (err.code !== "auth/user-not-found") {
        console.warn(`Could not delete Auth user ${email}:`, err.message);
      }
    }
  }
  if (deletedCount > 0) {
    console.log(`Deleted ${deletedCount} existing seed users from Firebase Auth`);
  }
}

async function seed() {
  try {
    const seedEmails = sampleNames.map((fullName) => {
      const [first] = fullName.split(" ");
      return `${first.toLowerCase()}@mail.com`;
    });

    // 1. Clean up Auth and Firestore collections
    await clearAuthUsersByEmail(seedEmails);
    await clearCollection("resources");
    await clearCollection("skills");
    await clearCollection("users");
    await clearCollection("classes");
    await clearCollection("projects");
    console.log("Cleared existing seed data...");

    // 2. Create Authenticated Users + Matching Firestore Profile Docs
    const usersRef = db.collection("users");
    const createdUsers = [];

    for (const fullName of sampleNames) {
      const [first, last] = fullName.split(" ");
      const email = `${first.toLowerCase()}@mail.com`;
      const username = (first + last).toLowerCase();

      // Step A: Create user in Firebase Authentication
      const authUser = await auth.createUser({
        email: email,
        password: SEED_USER_PASSWORD,
        displayName: fullName,
        emailVerified: true,
      });

      // Step B: Use authUser.uid directly as the Firestore Document ID
      const docRef = usersRef.doc(authUser.uid);
      const userData = {
        name: fullName,
        username: username,
        email: email,
        avatar: "",
        intro: "",
        bio: "",
        rating: 0,
        reviewCount: 0,
        pinnedBadges: [],
        createdAt: FieldValue.serverTimestamp(),
      };

      await docRef.set(userData);
      createdUsers.push({ id: authUser.uid, ...userData });
    }
    console.log(`Created ${createdUsers.length} authenticated users (Password: "${SEED_USER_PASSWORD}")...`);

    // 3. Skills
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
        mentorId: mentor.id, // Exactly matches mentor's auth uid
        mentorName: mentor.name,
        createdAt: FieldValue.serverTimestamp(),
      };
      await docRef.set(skillData);
      createdSkills.push({ id: docRef.id, ...skillData });
    }
    console.log(`Created ${createdSkills.length} skills...`);

    // 4. Resources
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

    // 5. Classes
    const now = Date.now();
    const hours = (n) => n * 60 * 60 * 1000;
    const days = (n) => n * 24 * hours(1);

    const sampleClasses = [
      {
        title: "React Native Basics: Building Your First Screen",
        topicTags: ["Tech"],
        mentor: createdUsers[0],
        scheduledAt: new Date(now - hours(1)),
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

    // 6. Projects
    const sampleProjects = [
      {
        title: "Campus Marketplace App",
        description: "A React Native app for students to buy/sell used textbooks and gear on campus.",
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
        description: "Match students into study groups based on course and availability.",
        status: "in-progress",
        creator: createdUsers[3],
        members: [createdUsers[3], createdUsers[0]],
        maxMembers: 3,
        skillsRequired: ["Node.js", "MongoDB"],
        joinRequests: [],
      },
      {
        title: "Alumni Mentorship Portal",
        description: "Connect current students with alumni mentors in their field.",
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
      const toMember = (u) => ({ id: u.id, name: u.name, username: u.username });
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

    console.log("\n==========================================");
    console.log("Seeding complete!");
    console.log(`All seed users can log in using password: ${SEED_USER_PASSWORD}`);
    console.log(`Example login: ${seedEmails[0]}`);
    console.log("==========================================");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();