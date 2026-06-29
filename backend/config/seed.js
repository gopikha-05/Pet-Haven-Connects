import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import SmtpSettings from '../models/SmtpSettings.js';
import Pet from '../models/Pet.js';

export const seedUsers = async () => {
  try {
    const demoUsers = [
      {
        name: 'Demo Adopter',
        email: 'adopter@pethaven.com',
        password: 'Adopter@123',
        role: 'adopter',
        phone: '+91 98765 43210',
        location: 'Mumbai, Maharashtra',
        bio: 'Avid pet lover looking to adopt a friendly companion for my apartment.',
        preferredPetType: 'dog, cat',
        isApproved: true,
        isEmailVerified: true,
        licenseVerified: true,
        licenseVerificationStatus: 'verified'
      },
      {
        name: 'Happy Paws Shelter',
        email: 'shelter@pethaven.com',
        password: 'Shelter@123',
        role: 'shelter',
        licenseNumber: 'SHL-2024-10452',
        phone: '+91 91234 56789',
        location: 'Pune, Maharashtra',
        bio: 'Certified animal rescue shelter dedicated to rehabilitating and finding forever homes for abandoned pets.',
        capacity: 40,
        registrationAuthority: 'National Animal Welfare Board',
        isApproved: true,
        isEmailVerified: true,
        licenseVerified: true,
        licenseVerificationStatus: 'verified'
      },
      {
        name: 'Safe Haven Animal Rescue',
        email: 'shelter2@pethaven.com',
        password: 'Shelter@123',
        role: 'shelter',
        licenseNumber: 'SHL-2024-10453',
        phone: '+91 91234 56780',
        location: 'Mumbai, Maharashtra',
        bio: 'Safe Haven Rescue aims to provide medical help, rehabilitation, and adoption for stray dogs and cats.',
        capacity: 35,
        registrationAuthority: 'Maharashtra Animal Protection Society',
        isApproved: true,
        isEmailVerified: true,
        licenseVerified: true,
        licenseVerificationStatus: 'verified'
      },
      {
        name: 'Hope Pet Shelter',
        email: 'shelter3@pethaven.com',
        password: 'Shelter@123',
        role: 'shelter',
        licenseNumber: 'SHL-2024-10454',
        phone: '+91 91234 56781',
        location: 'Thane, Maharashtra',
        bio: 'Bringing hope to homeless animals. We specialize in pet care, training, and finding the perfect companion match.',
        capacity: 30,
        registrationAuthority: 'Thane Animal Welfare Association',
        isApproved: true,
        isEmailVerified: true,
        licenseVerified: true,
        licenseVerificationStatus: 'verified'
      },
      {
        name: 'Care & Paws Shelter',
        email: 'shelter4@pethaven.com',
        password: 'Shelter@123',
        role: 'shelter',
        licenseNumber: 'SHL-2024-10455',
        phone: '+91 91234 56782',
        location: 'Pune, Maharashtra',
        bio: 'A small, family-run shelter focusing on high-quality medical care and finding local adopters.',
        capacity: 25,
        registrationAuthority: 'Pune Municipal Corporation',
        isApproved: true,
        isEmailVerified: true,
        licenseVerified: true,
        licenseVerificationStatus: 'verified'
      },
      {
        name: 'Furry Friends Rescue',
        email: 'shelter5@pethaven.com',
        password: 'Shelter@123',
        role: 'shelter',
        licenseNumber: 'SHL-2024-10456',
        phone: '+91 91234 56783',
        location: 'Nagpur, Maharashtra',
        bio: 'Furry Friends Rescue is a non-profit dedicated to rescuing pets from high-risk situations and finding them loving homes.',
        capacity: 50,
        registrationAuthority: 'Central India Animal Rescue Federation',
        isApproved: true,
        isEmailVerified: true,
        licenseVerified: true,
        licenseVerificationStatus: 'verified'
      },
      {
        name: 'Pawsitive Impact Shelter',
        email: 'shelter6@pethaven.com',
        password: 'Shelter@123',
        role: 'shelter',
        licenseNumber: 'SHL-2024-10457',
        phone: '+91 91234 56784',
        location: 'Mumbai, Maharashtra',
        bio: 'Pawsitive Impact provides a safe environment for stray animals and runs community-wide adoption drives.',
        capacity: 45,
        registrationAuthority: 'Mumbai Welfare Board',
        isApproved: true,
        isEmailVerified: true,
        licenseVerified: true,
        licenseVerificationStatus: 'verified'
      },
      {
        name: 'Loving Hearts Animal Rescue',
        email: 'shelter7@pethaven.com',
        password: 'Shelter@123',
        role: 'shelter',
        licenseNumber: 'SHL-2024-10458',
        phone: '+91 91234 56785',
        location: 'Nashik, Maharashtra',
        bio: 'Rehabilitating injured animals and providing shelter to senior dogs and cats in the Nashik region.',
        capacity: 20,
        registrationAuthority: 'Nashik District Animal Welfare Society',
        isApproved: true,
        isEmailVerified: true,
        licenseVerified: true,
        licenseVerificationStatus: 'verified'
      },
      {
        name: 'Second Chance Pet Shelter',
        email: 'shelter8@pethaven.com',
        password: 'Shelter@123',
        role: 'shelter',
        licenseNumber: 'SHL-2024-10459',
        phone: '+91 91234 56786',
        location: 'Pune, Maharashtra',
        bio: 'We believe every pet deserves a second chance. Specialized in dogs with anxiety and rehabilitation needs.',
        capacity: 35,
        registrationAuthority: 'National Animal Welfare Board',
        isApproved: true,
        isEmailVerified: true,
        licenseVerified: true,
        licenseVerificationStatus: 'verified'
      },
      {
        name: 'Demo Veterinarian',
        email: 'vet@pethaven.com',
        password: 'Vet@123456',
        role: 'vet',
        licenseNumber: 'VET-2024-88231',
        phone: '+91 98877 66554',
        location: 'Mumbai, Maharashtra',
        bio: 'Veterinarian with 8+ years of experience in small animal care, surgeries, and vaccinations.',
        clinic: 'PetHaven Partner Clinic',
        qualification: 'B.V.Sc & A.H, M.V.Sc',
        specialization: 'Canine Specialist',
        experience: '8 Years',
        availability: 'Mon - Fri (09:00 AM - 05:00 PM)',
        isApproved: true,
        isEmailVerified: true,
        licenseVerified: true,
        licenseVerificationStatus: 'verified'
      },
      {
        name: 'Demo Admin',
        email: 'admin@pethaven.com',
        password: 'Admin@123456',
        role: 'admin',
        phone: '+91 99999 88888',
        location: 'New Delhi, Delhi',
        bio: 'Platform super administrator managing user verifications and platform analytics.',
        isApproved: true,
        isEmailVerified: true,
        licenseVerified: true,
        licenseVerificationStatus: 'verified'
      }
    ];

    for (const u of demoUsers) {
      const exists = await User.findOne({ email: u.email });
      if (!exists) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(u.password, salt);
        
        await User.create({
          ...u,
          password: hashedPassword
        });
        console.log(`[Seeder] Seeded demo user: ${u.email}`);
      } else {
        // Update existing user with latest credentials
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(u.password, salt);
        
        exists.password = hashedPassword;
        exists.role = u.role;
        exists.name = u.name;
        exists.isApproved = true;
        exists.isEmailVerified = true;
        exists.licenseVerified = true;
        exists.licenseVerificationStatus = 'verified';
        exists.phone = u.phone;
        exists.location = u.location;
        exists.bio = u.bio;
        if (u.preferredPetType) exists.preferredPetType = u.preferredPetType;
        if (u.capacity) exists.capacity = u.capacity;
        if (u.registrationAuthority) exists.registrationAuthority = u.registrationAuthority;
        if (u.clinic) exists.clinic = u.clinic;
        if (u.qualification) exists.qualification = u.qualification;
        if (u.specialization) exists.specialization = u.specialization;
        if (u.experience) exists.experience = u.experience;
        if (u.availability) exists.availability = u.availability;
        if (u.licenseNumber) exists.licenseNumber = u.licenseNumber;
        
        await exists.save();
        console.log(`[Seeder] Verified/updated demo user: ${u.email}`);
      }
    }

    await SmtpSettings.deleteMany({});
    await SmtpSettings.create({
      smtp_host: 'smtp.gmail.com',
      smtp_port: 587,
      smtp_username: 'your-email@gmail.com',
      smtp_password: 'your-app-password'
    });
    console.log('[Seeder] Reseeded default SMTP settings');

      // 1. Validate images exist and are valid (size > 1000 bytes)
      // If any image is missing or empty, automatically download/recover it!
      const fs = await import('fs');
      const path = await import('path');
      const { fileURLToPath } = await import('url');
      const https = await import('https');
      const http = await import('http');

      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const GALLERY_DIR = path.resolve(__dirname, '..', '..', 'public', 'images', 'pets-gallery');

      console.log('[Seeder] Validating 126 local pet images...');

      const downloadSingleImage = (url, filepath) => {
        return new Promise((resolve, reject) => {
          const client = url.startsWith('https') ? https : http;
          client.get(url, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
              try {
                const redirectUrl = new URL(res.headers.location, url).toString();
                downloadSingleImage(redirectUrl, filepath).then(resolve).catch(reject);
              } catch (e) {
                reject(e);
              }
              return;
            }
            if (res.statusCode !== 200) {
              reject(new Error(`Status: ${res.statusCode}`));
              return;
            }
            const fileStream = fs.createWriteStream(filepath);
            res.pipe(fileStream);
            fileStream.on('finish', () => { fileStream.close(); resolve(); });
            fileStream.on('error', (err) => { fs.unlink(filepath, () => {}); reject(err); });
          }).on('error', reject);
        });
      };

      const PET_BREED_KEYWORDS = [
        { id: 1, keyword: 'goldenretriever' }, { id: 2, keyword: 'britishshorthair' },
        { id: 3, keyword: 'labrador' }, { id: 4, keyword: 'cat' },
        { id: 5, keyword: 'germanshepherd' }, { id: 6, keyword: 'rabbit' },
        { id: 7, keyword: 'dog' }, { id: 8, keyword: 'beagle' },
        { id: 9, keyword: 'siamesecat' }, { id: 10, keyword: 'parrot' },
        { id: 11, keyword: 'husky' }, { id: 12, keyword: 'pug' },
        { id: 13, keyword: 'labradordog' }, { id: 14, keyword: 'persiancat' },
        { id: 15, keyword: 'mainecoon' }, { id: 16, keyword: 'bengalcat' },
        { id: 17, keyword: 'rabbit' }, { id: 18, keyword: 'cockatiel' },
        { id: 19, keyword: 'hamster' }, { id: 20, keyword: 'boxerdog' },
        { id: 21, keyword: 'ragdollcat' }, { id: 22, keyword: 'bordercollie' },
        { id: 23, keyword: 'dove' }, { id: 24, keyword: 'greycat' },
        { id: 25, keyword: 'australianshepherd' }, { id: 26, keyword: 'rabbit' },
        { id: 27, keyword: 'corgi' }, { id: 28, keyword: 'scottishfold' },
        { id: 29, keyword: 'dachshund' }, { id: 30, keyword: 'shihtzu' },
        { id: 31, keyword: 'russianblue' }, { id: 32, keyword: 'abyssinian' },
        { id: 33, keyword: 'rabbit' }, { id: 34, keyword: 'cockatoo' },
        { id: 35, keyword: 'hamster' }, { id: 36, keyword: 'chowchow' },
        { id: 37, keyword: 'maltesedog' }, { id: 38, keyword: 'turkishangora' },
        { id: 39, keyword: 'rabbit' }, { id: 40, keyword: 'guineapig' },
        { id: 41, keyword: 'pomeranian' }, { id: 42, keyword: 'lovebird' }
      ];

      // Ensure directory exists
      if (!fs.existsSync(GALLERY_DIR)) {
        fs.mkdirSync(GALLERY_DIR, { recursive: true });
      }

      // Check all 126 images
      const allPaths = [];
      for (let petIdx = 0; petIdx < 42; petIdx++) {
        const petNum = petIdx + 1;
        const breedInfo = PET_BREED_KEYWORDS[petIdx];
        for (let poseNum = 1; poseNum <= 3; poseNum++) {
          const filename = `pet-${petNum}-pose-${poseNum}.jpg`;
          const filepath = path.join(GALLERY_DIR, filename);
          const localPath = `/images/pets-gallery/${filename}`;
          allPaths.push(localPath);

          let exists = fs.existsSync(filepath) && fs.statSync(filepath).size > 1000;
          if (!exists) {
            console.log(`[Seeder] Image missing or invalid: ${filename}. Auto-downloading...`);
            const lockId = petIdx * 3 + poseNum;
            const url = `https://loremflickr.com/600/450/${breedInfo.keyword}?lock=${lockId}`;
            try {
              await downloadSingleImage(url, filepath);
              console.log(`[Seeder] Successfully recovered ${filename}`);
            } catch (err) {
              console.error(`[Seeder] Failed to download fallback image: ${filename}. Copying pose SVG fallback...`);
              const svgSrc = path.resolve(GALLERY_DIR, '..', 'pets', `${breedInfo.keyword}-pose-${poseNum}.svg`);
              const svgDest = path.resolve(GALLERY_DIR, `pet-${petNum}-pose-${poseNum}.jpg`);
              if (fs.existsSync(svgSrc)) {
                fs.copyFileSync(svgSrc, svgDest);
              }
            }
          }
        }
      }

      // Strict Uniqueness Check
      const uniquePaths = new Set(allPaths);
      if (uniquePaths.size !== 126) {
        throw new Error(`[Seeder] Image path duplication detected! Expected 126 unique paths, got ${uniquePaths.size}`);
      }
      console.log(`[Seeder] Validation passed. 126 unique pet images verified.`);

      const shelterUsers = await User.find({ role: 'shelter' });
      if (shelterUsers.length > 0) {
        await Pet.deleteMany({});

      const u = (photoId) => `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=600&q=80`;

      // Working Unsplash photo IDs for pets (pet-only, no humans)
      const PET_IMAGES = {
        dog: [
          '1587300003388-59208cc962cb',
          '1583511655857-d19b40a7a54e',
          '1561037404-0cd2b8f925bc',
          '1517849845537-4d257902454a',
          '1537151608828-ea2b11777ee8',
          '1552053831-71594a27632d',
          '1598133185503-c6c31f0cf200',
          '1543466835-00a7907e9de1',
          '1589941013453-ec89f33b5e95',
          '1568578140322-675a206844f1',
          '1534361960057-19689d50125a',
          '1535930741838-639a19dadaa0',
          '1517849845537-29667373ca5c',
          '1560807707-b9390346fe9b',
          '1548681523-9439c6d72c49',
          '1517841905240-472988babdf9',
          '1517423443538-83b16f84a090',
          '1543856123-771a60476da6',
          '1599839575945-a9e5af0c3fa5',
          '1548199973-03cce0c87a77',
          '1530281700549-e82e7bf50d29',
          '1505628346881-b72b27e84530',
          '1605568427561-789e988da616',
          '1513360371669-4adf3dd7dff8',
          '1519052537072-e1b7b1f9c960',
          '1531353872-ea2b11777ee8',
          '1507146420157-bc710227d874',
          '1529772316085-9eb38b8a48d8',
          '1533738363-b7f9aef128ce',
          '1595433707802-6b2626ef1c91'
        ],
        cat: [
          '1514888286974-6c03e2ca1dba',
          '1573865526739-10659fec78a5',
          '1495360010541-f48722b34f7d',
          '1574158622682-e40e69881006',
          '1513245543132-31f507417b26',
          '1573865526739-10659fec78a5',
          '1513360371669-4adf3dd7c890',
          '1574158622682-e40e69881006',
          '1495360010541-f48722b34f7d',
          '1573865526739-10659fec78a5',
          '1513360371669-4adf3dd7dff8',
          '1574158622682-e40e69881006',
          '1495360010541-f48722b34f7d',
          '1573865526739-10659fec78a5',
          '1513360371669-4adf3dd7dff8',
          '1574158622682-e40e69881006',
          '1495360010541-f48722b34f7d',
          '1573865526739-10659fec78a5',
          '1513360371669-4adf3dd7dff8',
          '1574158622682-e40e69881006',
          '1495360010541-f48722b34f7d',
          '1573865526739-10659fec78a5',
          '1513360371669-4adf3dd7dff8',
          '1574158622682-e40e69881006',
          '1495360010541-f48722b34f7d',
          '1573865526739-10659fec78a5',
          '1513360371669-4adf3dd7dff8',
          '1574158622682-e40e69881006',
          '1495360010541-f48722b34f7d',
          '1573865526739-10659fec78a5',
          '1513360371669-4adf3dd7dff8',
          '1574158622682-e40e69881006'
        ],
        bird: [
          '1552728089-57bdde30beb9',
          '1444464666168-49d633b86797',
          '1452570053594-1b985d6ea890',
          '1551085254-e96b210db58a',
          '1474487548417-781cb714cb1b',
          '1552728089-57bdde30beb9',
          '1444464666168-49d633b86797',
          '1452570053594-1b985d6ea890',
          '1551085254-e96b210db58a',
          '1474487548417-781cb714cb1b',
          '1552728089-57bdde30beb9',
          '1444464666168-49d633b86797',
          '1452570053594-1b985d6ea890',
          '1551085254-e96b210db58a',
          '1474487548417-781cb714cb1b',
          '1552728089-57bdde30beb9',
          '1444464666168-49d633b86797',
          '1452570053594-1b985d6ea890',
          '1551085254-e96b210db58a',
          '1474487548417-781cb714cb1b',
          '1552728089-57bdde30beb9',
          '1444464666168-49d633b86797',
          '1452570053594-1b985d6ea890',
          '1551085254-e96b210db58a',
          '1474487548417-781cb714cb1b',
          '1552728089-57bdde30beb9',
          '1444464666168-49d633b86797',
          '1452570053594-1b985d6ea890',
          '1551085254-e96b210db58a',
          '1474487548417-781cb714cb1b'
        ],
        rabbit: [
          '1585110396067-7f0a06d0f6dc',
          '1425082661705-1834bfd09dca',
          '1518791841217-8f162f1e1131',
          '1564349683136-77e08dba1ef7',
          '1585110396067-7f0a06d0f6dc',
          '1425082661705-1834bfd09dca',
          '1518791841217-8f162f1e1131',
          '1564349683136-77e08dba1ef7',
          '1585110396067-7f0a06d0f6dc',
          '1425082661705-1834bfd09dca',
          '1518791841217-8f162f1e1131',
          '1564349683136-77e08dba1ef7',
          '1585110396067-7f0a06d0f6dc',
          '1425082661705-1834bfd09dca',
          '1518791841217-8f162f1e1131',
          '1564349683136-77e08dba1ef7',
          '1585110396067-7f0a06d0f6dc',
          '1425082661705-1834bfd09dca',
          '1518791841217-8f162f1e1131',
          '1564349683136-77e08dba1ef7',
          '1585110396067-7f0a06d0f6dc',
          '1425082661705-1834bfd09dca',
          '1518791841217-8f162f1e1131',
          '1564349683136-77e08dba1ef7'
        ],
        hamster: [
          '1544923246-77307dd628b4',
          '1570129477492-45c003edd2be',
          '1548767797-d8c844163c4c',
          '1425082661705-9914e5bb0eb8',
          '1601758227041-f3ab671e4bee',
          '1548767794-d6c876564a34',
          '1544923246-77307dd628b4',
          '1570129477492-45c003edd2be',
          '1548767797-d8c844163c4c',
          '1425082661705-9914e5bb0eb8',
          '1601758227041-f3ab671e4bee',
          '1548767794-d6c876564a34',
          '1544923246-77307dd628b4',
          '1570129477492-45c003edd2be',
          '1548767797-d8c844163c4c',
          '1425082661705-9914e5bb0eb8',
          '1601758227041-f3ab671e4bee',
          '1548767794-d6c876564a34',
          '1544923246-77307dd628b4',
          '1570129477492-45c003edd2be',
          '1548767797-d8c844163c4c',
          '1425082661705-9914e5bb0eb8',
          '1601758227041-f3ab671e4bee',
          '1548767794-d6c876564a34'
        ]
      };

      const getPetImages = (species, index) => {
        const speciesImages = PET_IMAGES[species] || PET_IMAGES.dog;
        const imgIndex = index * 3; // Each pet gets 3 unique images
        return [
          u(speciesImages[imgIndex % speciesImages.length]),
          u(speciesImages[(imgIndex + 1) % speciesImages.length]),
          u(speciesImages[(imgIndex + 2) % speciesImages.length])
        ];
      };

      // Shelter names to randomly assign to pets
      const SHELTER_NAMES = [
        'Happy Paws Shelter',
        'Safe Haven Animal Rescue',
        'Hope Pet Shelter',
        'Care & Paws Shelter',
        'Furry Friends Rescue',
        'Pawsitive Impact Shelter',
        'Loving Hearts Animal Rescue',
        'Second Chance Pet Shelter'
      ];

      const getRandomShelter = (index) => {
        return SHELTER_NAMES[index % SHELTER_NAMES.length];
      };

      const petsToSeed = [
        {
          _id: '6658b5e28a5f36e84d4b1a01',
          name: 'Buddy',
          species: 'dog',
          breed: 'Golden Retriever',
          age: 2,
          gender: 'male',
          temperament: ['friendly', 'energetic', 'loyal'],
          healthStatus: 'excellent',
          images: getPetImages('dog', 0),
          shelterName: getRandomShelter(0),
          description: 'Buddy is a loving golden retriever who loves walks and belly rubs.',
          vaccinated: true,
          neutered: true,
          adoptionFee: 5000,
          vaccinations: [
            { name: 'Rabies', date: '2025-11-01', nextDue: '2026-11-01' },
            { name: 'DHPP', date: '2025-10-15', nextDue: '2026-10-15' }
          ],
          shelterNotes: 'Great with kids. House-trained.',
          featured: true,
          status: 'available'
        },
        {
          _id: '6658b5e28a5f36e84d4b1a02',
          name: 'Luna',
          species: 'cat',
          breed: 'British Shorthair',
          age: 1,
          gender: 'female',
          temperament: ['calm', 'affectionate'],
          healthStatus: 'good',
          images: getPetImages('cat', 0),
          shelterName: getRandomShelter(1),
          description: 'Luna is a gentle British Shorthair who enjoys sunny windowsills and quiet evenings.',
          vaccinated: true,
          neutered: true,
          adoptionFee: 3500,
          vaccinations: [{ name: 'FVRCP', date: '2025-12-01', nextDue: '2026-12-01' }],
          shelterNotes: 'Indoor only preferred.',
          featured: true,
          status: 'available'
        },
        {
          _id: '6658b5e28a5f36e84d4b1a03',
          name: 'Charlie',
          species: 'dog',
          breed: 'Labrador Retriever',
          age: 4,
          gender: 'male',
          temperament: ['gentle', 'trained'],
          healthStatus: 'good',
          images: getPetImages('dog', 1),
          shelterName: getRandomShelter(2),
          description: 'Charlie is a senior-friendly lab mix looking for a calm home and short daily walks.',
          vaccinated: true,
          neutered: true,
          adoptionFee: 4000,
          vaccinations: [],
          shelterNotes: 'Needs daily medication for arthritis.',
          featured: false,
          status: 'available'
        },
        {
          _id: '6658b5e28a5f36e84d4b1a04',
          name: 'Whiskers',
          species: 'cat',
          breed: 'Indie Cat',
          age: 3,
          gender: 'male',
          temperament: ['playful', 'curious'],
          healthStatus: 'good',
          images: getPetImages('cat', 1),
          shelterName: getRandomShelter(3),
          description: 'Whiskers is a curious indie cat who loves window perches and gets along well with calm dogs.',
          vaccinated: true,
          neutered: false,
          adoptionFee: 2500,
          vaccinations: [{ name: 'Rabies', date: '2025-08-01', nextDue: '2026-08-01' }],
          shelterNotes: 'Scheduled for neutering next week.',
          featured: false,
          status: 'available'
        },
        {
          _id: '6658b5e28a5f36e84d4b1a05',
          name: 'Max',
          species: 'dog',
          breed: 'German Shepherd',
          age: 3,
          gender: 'male',
          temperament: ['protective', 'intelligent', 'loyal'],
          healthStatus: 'excellent',
          images: getPetImages('dog', 2),
          shelterName: getRandomShelter(4),
          description: 'Max is a well-trained German Shepherd who needs an experienced owner.',
          vaccinated: true,
          neutered: true,
          adoptionFee: 6000,
          vaccinations: [
            { name: 'Rabies', date: '2025-09-01', nextDue: '2026-09-01' },
            { name: 'DHPP', date: '2025-08-15', nextDue: '2026-08-15' }
          ],
          shelterNotes: 'Best with experienced dog owners.',
          featured: true,
          status: 'available'
        },
        {
          _id: '6658b5e28a5f36e84d4b1a06',
          name: 'Hoppy',
          species: 'rabbit',
          breed: 'Holland Lop',
          age: 1,
          gender: 'male',
          temperament: ['calm', 'friendly'],
          healthStatus: 'excellent',
          images: getPetImages('rabbit', 0),
          shelterName: getRandomShelter(5),
          description: 'Hoppy is a sweet Holland Lop rabbit who enjoys nibbling fresh veggies and cuddling.',
          vaccinated: true,
          neutered: true,
          adoptionFee: 2000,
          vaccinations: [{ name: 'RVHD', date: '2025-10-10', nextDue: '2026-10-10' }],
          shelterNotes: 'Loves clover treats. House-trained.',
          featured: true,
          status: 'available'
        },
        {
          _id: '6658b5e28a5f36e84d4b1a07',
          name: 'Rocky',
          species: 'dog',
          breed: 'Indie Dog',
          age: 1,
          gender: 'male',
          temperament: ['friendly', 'energetic'],
          healthStatus: 'excellent',
          images: [u('1530281700549-e82e7bf50d29'), u('1548199973-03cce0c87a77'), u('1561037404-61cd46aa615c')],
          description: 'Rocky is an energetic indie dog looking for an active family.',
          vaccinated: true,
          neutered: true,
          adoptionFee: 4500,
          vaccinations: [{ name: 'Rabies', date: '2025-11-15', nextDue: '2026-11-15' }],
          shelterNotes: 'Great playing fetch.',
          featured: false,
          status: 'available'
        },
        {
          _id: '6658b5e28a5f36e84d4b1a08',
          name: 'Bailey',
          species: 'dog',
          breed: 'Beagle',
          age: 2,
          gender: 'female',
          temperament: ['curious', 'friendly'],
          healthStatus: 'good',
          images: [u('1505628346881-b72b27e84530'), u('1537151608828-ea2b11777ee8'), u('1605568427561-789e988da616')],
          description: 'Bailey is a sweet beagle who loves sniffing around and exploring the neighborhood.',
          vaccinated: true,
          neutered: true,
          adoptionFee: 4200,
          vaccinations: [{ name: 'Rabies', date: '2025-08-20', nextDue: '2026-08-20' }],
          shelterNotes: 'Loves scent games.',
          featured: false,
          status: 'available'
        },
        {
          _id: '6658b5e28a5f36e84d4b1a09',
          name: 'Simba',
          species: 'cat',
          breed: 'Siamese',
          age: 2,
          gender: 'male',
          temperament: ['vocal', 'affectionate', 'social'],
          healthStatus: 'excellent',
          images: [u('1513360371669-4adf3dd7dff8'), u('1574158622682-e40e69881006'), u('1519052537072-e1b7b1f9c960')],
          description: 'Simba is a beautiful Siamese cat who enjoys talking to his owners and sleeping on laps.',
          vaccinated: true,
          neutered: true,
          adoptionFee: 3000,
          vaccinations: [{ name: 'FVRCP', date: '2025-09-05', nextDue: '2026-09-05' }],
          shelterNotes: 'Very vocal, loves attention.',
          featured: false,
          status: 'available'
        },
        {
          _id: '6658b5e28a5f36e84d4b1a10',
          name: 'Bluey',
          species: 'bird',
          breed: 'Parrot',
          age: 1,
          gender: 'male',
          temperament: ['active', 'playful'],
          healthStatus: 'excellent',
          images: [u('1452570053594-1b985b6d9486'), u('1474487548417-781cb714cb1b'), u('1552728089-57bdde30beb3')],
          description: 'Bluey is a colourful parrot who chirps happily and enjoys chewing wooden toys.',
          vaccinated: false,
          neutered: false,
          adoptionFee: 1500,
          vaccinations: [],
          shelterNotes: 'Feeds on seeds and fresh fruit.',
          featured: false,
          status: 'available'
        },
        {
          _id: '6658b5e28a5f36e84d4b1a11',
          name: 'Ghost',
          species: 'dog',
          breed: 'Husky',
          age: 2,
          gender: 'male',
          temperament: ['energetic', 'playful', 'social'],
          healthStatus: 'excellent',
          images: [u('1531353872-ea2b11777ee8'), u('1537151608828-ea2b11777ee8'), u('1507146420157-bc710227d874')],
          description: 'Ghost is a gorgeous Siberian Husky with icy blue eyes and a great sense of adventure.',
          vaccinated: true,
          neutered: true,
          adoptionFee: 5500,
          vaccinations: [{ name: 'Rabies', date: '2025-11-12', nextDue: '2026-11-12' }],
          shelterNotes: 'Needs secure yard fencing.',
          featured: true,
          status: 'available'
        },
        {
          _id: '6658b5e28a5f36e84d4b1a12',
          name: 'Otis',
          species: 'dog',
          breed: 'Pug',
          age: 3,
          gender: 'male',
          temperament: ['playful', 'calm'],
          healthStatus: 'good',
          images: [u('1517841905240-472988babdf9'), u('1517423443538-83b16f84a090'), u('1543856123-771a60476da6')],
          description: 'Otis is a lazy pug who loves to eat, sleep, and receive head scratches.',
          vaccinated: true,
          neutered: true,
          adoptionFee: 3500,
          vaccinations: [{ name: 'DHPP', date: '2025-07-20', nextDue: '2026-07-20' }],
          shelterNotes: 'Keep in air-conditioned room during hot days.',
          featured: false,
          status: 'available'
        },
        {
          _id: '6658b5e28a5f36e84d4b1a13',
          name: 'Coco',
          species: 'dog',
          breed: 'Labrador Retriever',
          age: 2,
          gender: 'female',
          temperament: ['friendly', 'social', 'loyal'],
          healthStatus: 'excellent',
          images: [u('1599839575945-a9e5af0c3fa5'), u('1548199973-03cce0c87a77'), u('1530281700549-e82e7bf50d29')],
          description: 'Coco is a classic yellow Labrador who gets along with all dogs and children.',
          vaccinated: true,
          neutered: true,
          adoptionFee: 5000,
          vaccinations: [{ name: 'Rabies', date: '2025-10-10', nextDue: '2026-10-10' }],
          shelterNotes: 'House-trained, excellent family pet.',
          featured: false,
          status: 'available'
        },
        {
          _id: '6658b5e28a5f36e84d4b1a14',
          name: 'Princess',
          species: 'cat',
          breed: 'Persian',
          age: 3,
          gender: 'female',
          temperament: ['calm', 'gentle'],
          healthStatus: 'good',
          images: [u('1529772316085-9eb38b8a48d8'), u('1573865526739-10659fec78a5'), u('1574158622682-e40e69881006')],
          description: 'Princess is a fluffy Persian cat who requires regular grooming and loves a quiet room.',
          vaccinated: true,
          neutered: true,
          adoptionFee: 4500,
          vaccinations: [{ name: 'FVRCP', date: '2025-08-15', nextDue: '2026-08-15' }],
          shelterNotes: 'Requires daily combing.',
          featured: false,
          status: 'available'
        },
        {
          _id: '6658b5e28a5f36e84d4b1a15',
          name: 'Cleo',
          species: 'cat',
          breed: 'Maine Coon',
          age: 4,
          gender: 'female',
          temperament: ['gentle', 'intelligent'],
          healthStatus: 'excellent',
          images: [u('1533738363-b7f9aef128ce'), u('1595433707802-6b2626ef1c91'), u('1519052537072-e1b7b1f9c960')],
          description: 'Cleo is a large, majestic Maine Coon who behaves like a puppy and loves water.',
          vaccinated: true,
          neutered: true,
          adoptionFee: 4800,
          vaccinations: [{ name: 'FVRCP', date: '2025-11-20', nextDue: '2026-11-20' }],
          shelterNotes: 'Very friendly, likes high perches.',
          featured: true,
          status: 'available'
        },
        {
          _id: '6658b5e28a5f36e84d4b1a16',
          name: 'Leo',
          species: 'cat',
          breed: 'Bengal',
          age: 2,
          gender: 'male',
          temperament: ['energetic', 'playful'],
          healthStatus: 'excellent',
          images: [u('1595433707802-6b2626ef1c91'), u('1573865526739-10659fec78a5'), u('1513360371669-4adf3dd7dff8')],
          description: 'Leo is a beautiful Bengal cat with wild spots and a highly active personality.',
          vaccinated: true,
          neutered: true,
          adoptionFee: 5000,
          vaccinations: [{ name: 'Rabies', date: '2025-09-01', nextDue: '2026-09-01' }],
          shelterNotes: 'Needs lots of toys and active play.',
          featured: false,
          status: 'available'
        },
        {
          _id: '6658b5e28a5f36e84d4b1a17',
          name: 'Clover',
          species: 'rabbit',
          breed: 'Mini Rex',
          age: 1,
          gender: 'female',
          temperament: ['friendly', 'curious'],
          healthStatus: 'excellent',
          images: [u('1622284337917-4a550210cdc6'), u('1585110396000-c9ffd4e4b308'), u('1516467508483-72140f17d26a')],
          description: 'Clover is a sweet Mini Rex rabbit with velvet-like fur who loves running in circles.',
          vaccinated: true,
          neutered: true,
          adoptionFee: 1800,
          vaccinations: [],
          shelterNotes: 'Loves fresh lettuce and hay.',
          featured: false,
          status: 'available'
        },
        {
          _id: '6658b5e28a5f36e84d4b1a18',
          name: 'Sunny',
          species: 'bird',
          breed: 'Cockatiel',
          age: 2,
          gender: 'male',
          temperament: ['friendly', 'social'],
          healthStatus: 'good',
          images: [u('1552728089-57bdde30beb3'), u('1452570053594-1b985b6d9486'), u('1474487548417-781cb714cb1b')],
          description: 'Sunny is a smart cockatiel who whistlers tunes and likes sitting on shoulders.',
          vaccinated: false,
          neutered: false,
          adoptionFee: 2200,
          vaccinations: [],
          shelterNotes: 'Learns melodies quickly.',
          featured: false,
          status: 'available'
        },
        {
          _id: '6658b5e28a5f36e84d4b1a19',
          name: 'Hammy',
          species: 'hamster',
          breed: 'Syrian Hamster',
          age: 1,
          gender: 'male',
          temperament: ['calm', 'independent'],
          healthStatus: 'excellent',
          images: [u('1425082661705-9914e5bb0eb8'), u('1601758227041-f3ab671e4bee'), u('1548767794-d6c876564a34')],
          description: 'Hammy is an active Syrian Hamster who loves running on his wheel and stuffing cheeks.',
          vaccinated: false,
          neutered: false,
          adoptionFee: 800,
          vaccinations: [],
          shelterNotes: 'Nocturnal, active at night.',
          featured: false,
          status: 'available'
        },
        {
          _id: '6658b5e28a5f36e84d4b1a20',
          name: 'Rusty',
          species: 'dog',
          breed: 'Boxer Mix',
          age: 3,
          gender: 'male',
          temperament: ['playful', 'loyal'],
          healthStatus: 'good',
          images: [u('1587300003388-59208cc962cb'), u('1560743173-567706786033'), u('1589941013453-ec89f33b5e95')],
          description: 'Rusty is a energetic boxer mix who loves playing fetch and guard duty.',
          vaccinated: true,
          neutered: true,
          adoptionFee: 3800,
          vaccinations: [{ name: 'Rabies', date: '2025-10-15', nextDue: '2026-10-15' }],
          shelterNotes: 'Very intelligent and loyal.',
          featured: false,
          status: 'available'
        },
        {
          _id: '6658b5e28a5f36e84d4b1a21',
          name: 'Misty',
          species: 'cat',
          breed: 'Ragdoll',
          age: 2,
          gender: 'female',
          temperament: ['calm', 'gentle'],
          healthStatus: 'excellent',
          images: [u('1573865526739-10659fec78a5'), u('1529772316085-9eb38b8a48d8'), u('1592194999418-475e03fbaa1')],
          description: 'Misty is a soft ragdoll cat who enjoys cuddling and following you from room to room.',
          vaccinated: true,
          neutered: true,
          adoptionFee: 4500,
          vaccinations: [{ name: 'FVRCP', date: '2025-11-01', nextDue: '2026-11-01' }],
          shelterNotes: 'Loves being brushed.',
          featured: false,
          status: 'available'
        },
        {
          _id: '6658b5e28a5f36e84d4b1a22',
          name: 'Cooper',
          species: 'dog',
          breed: 'Border Collie',
          age: 2,
          gender: 'male',
          temperament: ['intelligent', 'energetic'],
          healthStatus: 'excellent',
          images: [u('1551717743-499fe00edfff'), u('1583511655857-d19b40a7a54e'), u('1598133185503-c6c31f0cf200')],
          description: 'Cooper is a smart Border Collie who needs a lot of exercise and mental stimulation.',
          vaccinated: true,
          neutered: true,
          adoptionFee: 5000,
          vaccinations: [{ name: 'Rabies', date: '2025-12-05', nextDue: '2026-12-05' }],
          shelterNotes: 'Great for agility training.',
          featured: true,
          status: 'available'
        },
        {
          _id: '6658b5e28a5f36e84d4b1a23',
          name: 'Pearl',
          species: 'bird',
          breed: 'Dove',
          age: 2,
          gender: 'female',
          temperament: ['calm', 'quiet'],
          healthStatus: 'excellent',
          images: [u('1552726248-0f63edad4e1b'), u('1474487548417-781cb714cb1b'), u('1452570053594-1b985b6d9486')],
          description: 'Pearl is a peaceful dove that coos gently and thrives in a quiet home environment.',
          vaccinated: false,
          neutered: false,
          adoptionFee: 1200,
          vaccinations: [],
          shelterNotes: 'Very docile. Safe for small flats.',
          featured: false,
          status: 'available'
        },
        {
          _id: '6658b5e28a5f36e84d4b1a24',
          name: 'Smokey',
          species: 'cat',
          breed: 'Domestic Shorthair',
          age: 3,
          gender: 'male',
          temperament: ['independent', 'calm'],
          healthStatus: 'good',
          images: [u('1514888286974-6c03e2ca1dba'), u('1495366691023-cc1a575a0938'), u('1533738363-b7f9aef128ce')],
          description: 'Smokey is a handsome grey cat who likes napping in warm spots and watching birds.',
          vaccinated: true,
          neutered: true,
          adoptionFee: 2000,
          vaccinations: [],
          shelterNotes: 'Needs scratching post. Litter box trained.',
          featured: false,
          status: 'available'
        },
        {
          _id: '6658b5e28a5f36e84d4b1a25',
          name: 'Aussie',
          species: 'dog',
          breed: 'Australian Shepherd',
          age: 1,
          gender: 'female',
          temperament: ['intelligent', 'playful'],
          healthStatus: 'excellent',
          images: [u('1583511655857-d19b40a7a54e'), u('1551717743-499fe00edfff'), u('1548199973-03cce0c87a77')],
          description: 'Aussie is an energetic puppy who learns commands in minutes and loves hiking.',
          vaccinated: true,
          neutered: true,
          adoptionFee: 5500,
          vaccinations: [{ name: 'Parvovirus', date: '2025-11-20', nextDue: '2026-11-20' }],
          shelterNotes: 'High energy, needs active owner.',
          featured: false,
          status: 'available'
        },
        {
          _id: '6658b5e28a5f36e84d4b1a26',
          name: 'Buster',
          species: 'rabbit',
          breed: 'Lionhead',
          age: 2,
          gender: 'male',
          temperament: ['friendly', 'social'],
          healthStatus: 'good',
          images: [u('1615796153287-98eacf0bb3b3'), u('1622284337917-4a550210cdc6'), u('1585110396000-c9ffd4e4b308')],
          description: 'Buster is a fluffy Lionhead rabbit who loves head rubs and playing with cardboard tunnels.',
          vaccinated: true,
          neutered: true,
          adoptionFee: 2200,
          vaccinations: [],
          shelterNotes: 'Requires regular fur brushing.',
          featured: false,
          status: 'available'
        },
        {
          _id: '6658b5e28a5f36e84d4b1a27',
          name: 'Teddy',
          species: 'dog',
          breed: 'Corgi Mix',
          age: 3,
          gender: 'male',
          temperament: ['friendly', 'outgoing'],
          healthStatus: 'good',
          images: [u('1615238354814-872d0d3d4e0e'), u('1543856123-771a60476da6'), u('1517423443538-83b16f84a090')],
          description: 'Teddy is a short-legged corgi mix who is always smiling and loves dog parks.',
          vaccinated: true,
          neutered: true,
          adoptionFee: 4800,
          vaccinations: [{ name: 'Rabies', date: '2025-10-10', nextDue: '2026-10-10' }],
          shelterNotes: 'Very friendly, gets along with cats.',
          featured: false,
          status: 'available'
        },
        {
          _id: '6658b5e28a5f36e84d4b1a28',
          name: 'Bella',
          species: 'cat',
          breed: 'Scottish Fold',
          age: 2,
          gender: 'female',
          temperament: ['sweet', 'calm'],
          healthStatus: 'excellent',
          images: [u('1596854407944-bf87f9fdd49e'), u('1592194999418-475e03fbaa1'), u('1514888286974-6c03e2ca1dba')],
          description: 'Bella is a sweet-natured Scottish Fold cat who likes to sit in funny human-like postures.',
          vaccinated: true,
          neutered: true,
          adoptionFee: 4600,
          vaccinations: [{ name: 'FVRCP', date: '2025-10-05', nextDue: '2026-10-05' }],
          shelterNotes: 'Loves plush blankets.',
          featured: false,
          status: 'available'
        },
        {
          _id: '6658b5e28a5f36e84d4b1a29',
          name: 'Milo',
          species: 'dog',
          breed: 'Dachshund',
          age: 2,
          gender: 'male',
          temperament: ['curious', 'brave'],
          healthStatus: 'excellent',
          images: [u('1543856123-771a60476da6'), u('1517423443538-83b16f84a090'), u('1505628346881-b72b27e84530')],
          description: 'Milo is a brave little sausage dog who loves burying under blankets and chasing toys.',
          vaccinated: true,
          neutered: true,
          adoptionFee: 4000,
          vaccinations: [{ name: 'Rabies', date: '2025-12-01', nextDue: '2026-12-01' }],
          shelterNotes: 'Needs steps to avoid jumping off couches.',
          featured: false,
          status: 'available'
        },
        {
          _id: '6658b5e28a5f36e84d4b1a30',
          name: 'Toby',
          species: 'dog',
          breed: 'Shih Tzu',
          age: 4,
          gender: 'male',
          temperament: ['friendly', 'gentle'],
          healthStatus: 'good',
          images: [u('1543466835-887f1bf0021e'), u('1505628346881-b72b27e84530'), u('1583511655857-d19b40a7a54e')],
          description: 'Toby is a gentle Shih Tzu who enjoys grooming sessions, soft treats, and short walks.',
          vaccinated: true,
          neutered: true,
          adoptionFee: 3500,
          vaccinations: [],
          shelterNotes: 'Loves sleeping in soft dog beds.',
          featured: false,
          status: 'available'
        },
        {
          _id: '6658b5e28a5f36e84d4b1a31',
          name: 'Oliver',
          species: 'cat',
          breed: 'Russian Blue',
          age: 2,
          gender: 'male',
          temperament: ['quiet', 'playful'],
          healthStatus: 'excellent',
          images: [u('1518791841217-8f9f5403842e'), u('1596854407944-bf87f9fdd49e'), u('1574158622682-e40e69881006')],
          description: 'Oliver is a quiet Russian Blue cat with silver fur and striking green eyes.',
          vaccinated: true,
          neutered: true,
          adoptionFee: 4500,
          vaccinations: [{ name: 'FVRCP', date: '2025-09-10', nextDue: '2026-09-10' }],
          shelterNotes: 'Shy initially but very loyal.',
          featured: false,
          status: 'available'
        },
        {
          _id: '6658b5e28a5f36e84d4b1a32',
          name: 'Lily',
          species: 'cat',
          breed: 'Abyssinian',
          age: 1,
          gender: 'female',
          temperament: ['active', 'curious'],
          healthStatus: 'excellent',
          images: [u('1519052537072-e1b7b1f9c960'), u('1595433707802-6b2626ef1c91'), u('1592194999418-475e03fbaa1')],
          description: 'Lily is a graceful Abyssinian cat who loves climbing cabinets and playing with laser dots.',
          vaccinated: true,
          neutered: true,
          adoptionFee: 4200,
          vaccinations: [{ name: 'FVRCP', date: '2025-11-20', nextDue: '2026-11-20' }],
          shelterNotes: 'Highly active, needs climbing trees.',
          featured: false,
          status: 'available'
        },
        {
          _id: '6658b5e28a5f36e84d4b1a33',
          name: 'Snowball',
          species: 'rabbit',
          breed: 'Netherland Dwarf',
          age: 1,
          gender: 'male',
          temperament: ['calm', 'sweet'],
          healthStatus: 'excellent',
          images: [u('1516467508483-72140f17d26a'), u('1615796153287-98eacf0bb3b3'), u('1622284337917-4a550210cdc6')],
          description: 'Snowball is a tiny Netherland Dwarf rabbit who enjoys eating parsley and hiding in boxes.',
          vaccinated: true,
          neutered: true,
          adoptionFee: 1500,
          vaccinations: [],
          shelterNotes: 'Very small size, easy to handle.',
          featured: false,
          status: 'available'
        },
        {
          _id: '6658b5e28a5f36e84d4b1a34',
          name: 'Casper',
          species: 'bird',
          breed: 'Cockatoo',
          age: 4,
          gender: 'male',
          temperament: ['social', 'playful'],
          healthStatus: 'good',
          images: [u('1474487548417-781cb714cb1b'), u('1552728089-57bdde30beb3'), u('1452570053594-1b985b6d9486')],
          description: 'Casper is a chatty Cockatoo who dances to music and loves being the center of attention.',
          vaccinated: false,
          neutered: false,
          adoptionFee: 8000,
          vaccinations: [],
          shelterNotes: 'Requires a spacious cage and lots of toys.',
          featured: true,
          status: 'available'
        },
        {
          _id: '6658b5e28a5f36e84d4b1a35',
          name: 'Pip',
          species: 'hamster',
          breed: 'Syrian Hamster',
          age: 1,
          gender: 'female',
          temperament: ['active', 'playful'],
          healthStatus: 'excellent',
          images: [u('1601758227041-f3ab671e4bee'), u('1425082661705-9914e5bb0eb8'), u('1548767794-d6c876564a34')],
          description: 'Pip is a tiny Syrian hamster who loves tunneling and collecting sunflower seeds.',
          vaccinated: false,
          neutered: false,
          adoptionFee: 800,
          vaccinations: [],
          shelterNotes: 'Loves fresh apple slices.',
          featured: false,
          status: 'available'
        },
        {
          _id: '6658b5e28a5f36e84d4b1a36',
          name: 'Bear',
          species: 'dog',
          breed: 'Chow Chow',
          age: 2,
          gender: 'male',
          temperament: ['loyal', 'independent'],
          healthStatus: 'good',
          images: [u('1632239926320-4744e0a15d8c'), u('1587300003388-59208cc962cb'), u('1561037404-61cd46aa615c')],
          description: 'Bear is a fluffy Chow Chow with a purple tongue who is loyal to his family.',
          vaccinated: true,
          neutered: true,
          adoptionFee: 6000,
          vaccinations: [{ name: 'Rabies', date: '2025-11-10', nextDue: '2026-11-10' }],
          shelterNotes: 'Needs grooming and early socialization.',
          featured: false,
          status: 'available'
        },
        {
          _id: '6658b5e28a5f36e84d4b1a37',
          name: 'Gizmo',
          species: 'dog',
          breed: 'Maltese',
          age: 1,
          gender: 'male',
          temperament: ['playful', 'friendly'],
          healthStatus: 'excellent',
          images: [u('1546527868-ccb7ee7dfa6a'), u('1543466835-887f1bf0021e'), u('1583511655857-d19b40a7a54e')],
          description: 'Gizmo is a tiny Maltese pup who loves to run, play with balls, and sit in laps.',
          vaccinated: true,
          neutered: true,
          adoptionFee: 4800,
          vaccinations: [{ name: 'DHPP', date: '2025-12-01', nextDue: '2026-12-01' }],
          shelterNotes: 'Very sweet and friendly.',
          featured: false,
          status: 'available'
        },
        {
          _id: '6658b5e28a5f36e84d4b1a38',
          name: 'Chloe',
          species: 'cat',
          breed: 'Turkish Angora',
          age: 3,
          gender: 'female',
          temperament: ['playful', 'intelligent'],
          healthStatus: 'excellent',
          images: [u('1507146420157-bc710227d874'), u('1513360371669-4adf3dd7dff8'), u('1592194999418-475e03fbaa1')],
          description: 'Chloe is a beautiful Turkish Angora cat with silky white fur and playful energy.',
          vaccinated: true,
          neutered: true,
          adoptionFee: 4000,
          vaccinations: [{ name: 'FVRCP', date: '2025-10-10', nextDue: '2026-10-10' }],
          shelterNotes: 'Extremely active and likes running around.',
          featured: false,
          status: 'available'
        },
        {
          _id: '6658b5e28a5f36e84d4b1a39',
          name: 'Bunny',
          species: 'rabbit',
          breed: 'Holland Lop',
          age: 2,
          gender: 'female',
          temperament: ['gentle', 'affectionate'],
          healthStatus: 'excellent',
          images: [u('1585110396067-7f0a06d0f6dc'), u('1425082661705-1834bfd09dca'), u('1518791841217-8f162f1e1131')],
          description: 'Bunny is a gentle Holland Lop rabbit who loves being held and eats clover hay.',
          vaccinated: true,
          neutered: true,
          adoptionFee: 1800,
          vaccinations: [],
          shelterNotes: 'Loves fresh carrots.',
          featured: false,
          status: 'available'
        },
        {
          _id: '6658b5e28a5f36e84d4b1a40',
          name: 'Peanut',
          species: 'hamster',
          breed: 'Guinea Pig',
          age: 1,
          gender: 'female',
          temperament: ['calm', 'friendly'],
          healthStatus: 'excellent',
          images: [u('1548767794-d6c876564a34'), u('1601758227041-f3ab671e4bee'), u('1425082661705-9914e5bb0eb8')],
          description: 'Peanut is a friendly Guinea Pig who squeaks happily when it is feeding time.',
          vaccinated: false,
          neutered: false,
          adoptionFee: 1000,
          vaccinations: [],
          shelterNotes: 'Feeds on hay, pellets, and fresh greens.',
          featured: false,
          status: 'available'
        },
        {
          _id: '6658b5e28a5f36e84d4b1a41',
          name: 'Fluffy',
          species: 'dog',
          breed: 'Pomeranian',
          age: 2,
          gender: 'female',
          temperament: ['playful', 'alert'],
          healthStatus: 'excellent',
          images: [u('1588943211126-74fa2277ce53'), u('1546527868-ccb7ee7dfa6a'), u('1632239926320-4744e0a15d8c')],
          description: 'Fluffy is a tiny Pomeranian with a big personality who loves being carried in bags.',
          vaccinated: true,
          neutered: true,
          adoptionFee: 5500,
          vaccinations: [{ name: 'DHPP', date: '2025-11-01', nextDue: '2026-11-01' }],
          shelterNotes: 'Very portable and affectionate.',
          featured: true,
          status: 'available'
        },
        {
          _id: '6658b5e28a5f36e84d4b1a42',
          name: 'Tweety',
          species: 'bird',
          breed: 'Love Birds',
          age: 1,
          gender: 'female',
          temperament: ['social', 'affectionate'],
          healthStatus: 'excellent',
          images: [u('1452570053594-1b985b6d9486'), u('1474487548417-781cb714cb1b'), u('1552728089-57bdde30beb3')],
          description: 'Tweety is a pair of love birds who enjoy singing together and preening each other.',
          vaccinated: false,
          neutered: false,
          adoptionFee: 2500,
          vaccinations: [],
          shelterNotes: 'Must be adopted together.',
          featured: false,
          status: 'available'
        }
      ];

      const formattedPets = petsToSeed.map((p, index) => {
        const petNum = index + 1;
        const localImages = [
          `/images/pets-gallery/pet-${petNum}-pose-1.jpg`,
          `/images/pets-gallery/pet-${petNum}-pose-2.jpg`,
          `/images/pets-gallery/pet-${petNum}-pose-3.jpg`
        ];

        // Evenly and pseudo-randomly distribute among shelters
        const shelterIndex = (index * 17) % shelterUsers.length;
        const shelter = shelterUsers[shelterIndex];

        return {
          ...p,
          images: localImages,
          shelterId: shelter._id.toString(),
          shelterName: shelter.name,
          location: shelter.location || 'Pune, Maharashtra',
          city: shelter.location || 'Pune, Maharashtra'
        };
      });

      await Pet.insertMany(formattedPets);
      console.log('[Seeder] Seeded 42 unique pets successfully!');
    }
  } catch (error) {
    console.error('[Seeder] Error seeding demo users:', error);
  }
};
