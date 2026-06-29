import Pet from '../models/Pet.js';
import User from '../models/User.js';
import { uploadToS3, deleteFromS3 } from '../services/s3Service.js';

/**
 * GET /api/pets
 * Get all pets with optional filters (species, breed, shelter, search, status)
 */
export const getPets = async (req, res) => {
  try {
    const { species, breed, shelter, search, status } = req.query;
    const query = {};

    // Apply status filter (default is available if not admin/shelter, or if status is specified)
    if (status) {
      query.status = status;
    } else {
      query.status = 'available';
    }

    // Apply species filter
    if (species) {
      query.species = species.toLowerCase();
    }

    // Apply breed filter
    if (breed) {
      query.breed = breed;
    }

    // Apply shelter filter
    if (shelter) {
      query.shelterId = shelter;
    }

    // Apply search filter (name or breed)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { breed: { $regex: search, $options: 'i' } }
      ];
    }

    const pets = await Pet.find(query).sort({ createdAt: -1 });
    
    // Map _id to id for frontend compatibility
    const formattedPets = pets.map(pet => {
      const p = pet.toObject();
      p.id = p._id.toString();
      return p;
    });

    res.json(formattedPets);
  } catch (error) {
    console.error('[PetController] Error fetching pets:', error);
    res.status(500).json({ message: 'Error fetching pets', error: error.message });
  }
};

/**
 * GET /api/pets/:id
 * Get a single pet by ID
 */
export const getPetById = async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);
    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }
    const formattedPet = pet.toObject();
    formattedPet.id = formattedPet._id.toString();
    res.json(formattedPet);
  } catch (error) {
    console.error('[PetController] Error fetching pet:', error);
    res.status(500).json({ message: 'Error fetching pet', error: error.message });
  }
};

/**
 * POST /api/pets
 * Create a new pet listing (Shelter only)
 */
export const createPet = async (req, res) => {
  // Check if user is shelter or admin
  if (req.user.role !== 'shelter' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized to list pets' });
  }

  const uploadedS3Urls = [];
  try {
    // 1. Upload new image files to S3 first
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const url = await uploadToS3(file, 'pets');
          uploadedS3Urls.push(url);
        } catch (uploadError) {
          console.error('[PetController] Error uploading image in createPet:', uploadError.message);
          // Rollback: delete already uploaded S3 files from this request
          for (const s3Url of uploadedS3Urls) {
            await deleteFromS3(s3Url);
          }
          return res.status(500).json({ message: 'S3 upload failed', error: uploadError.message });
        }
      }
    }

    // 2. Parse boolean and numeric fields from request body (which might be FormData strings)
    const vaccinated = req.body.vaccinated === 'true' || req.body.vaccinated === true;
    const neutered = req.body.neutered === 'true' || req.body.neutered === true;
    const age = req.body.age !== undefined ? Number(req.body.age) : 1;
    const adoptionFee = req.body.adoptionFee !== undefined ? Number(req.body.adoptionFee) : 0;

    // Handle temperament array
    let temperament = [];
    if (req.body.temperament) {
      temperament = Array.isArray(req.body.temperament)
        ? req.body.temperament
        : [req.body.temperament];
    }

    const petData = {
      ...req.body,
      images: uploadedS3Urls,
      vaccinated,
      neutered,
      age,
      adoptionFee,
      temperament,
      shelterId: req.user.id,
      shelterName: req.user.name,
      location: req.body.location || req.user.location || ''
    };

    // 3. Save pet document in MongoDB
    const pet = await Pet.create(petData);
    const formattedPet = pet.toObject();
    formattedPet.id = formattedPet._id.toString();

    console.log(`[PetController] Pet created successfully in DB: ${formattedPet.id}`);
    res.status(201).json(formattedPet);
  } catch (error) {
    console.error('[PetController] Error creating pet (triggering S3 rollback):', error);
    // Rollback S3 uploads if DB insertion fails
    for (const s3Url of uploadedS3Urls) {
      await deleteFromS3(s3Url);
    }
    res.status(500).json({ message: 'Error listing pet', error: error.message });
  }
};

/**
 * PUT /api/pets/:id
 * Update pet listing (Shelter/Admin only)
 */
export const updatePet = async (req, res) => {
  const newUploadedS3Urls = [];
  try {
    const pet = await Pet.findById(req.params.id);
    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }

    // Verify ownership
    if (req.user.role !== 'admin' && pet.shelterId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this pet listing' });
    }

    // 1. Upload new S3 images if any
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const url = await uploadToS3(file, 'pets');
          newUploadedS3Urls.push(url);
        } catch (uploadError) {
          console.error('[PetController] S3 upload error during update:', uploadError.message);
          // Rollback: delete already uploaded S3 files from this request
          for (const s3Url of newUploadedS3Urls) {
            await deleteFromS3(s3Url);
          }
          return res.status(500).json({ message: 'S3 upload failed', error: uploadError.message });
        }
      }
    }

    // 2. Parse existing images kept by user (can be array of URLs or a single URL)
    let existingImages = [];
    if (req.body.existingImages) {
      existingImages = Array.isArray(req.body.existingImages)
        ? req.body.existingImages
        : [req.body.existingImages];
    } else if (req.body.images) {
      // Handle fallback if client passes images list in body
      existingImages = Array.isArray(req.body.images)
        ? req.body.images
        : [req.body.images];
    }

    // Combine remaining existing images and new S3 uploads
    const finalImages = [...existingImages, ...newUploadedS3Urls].slice(0, 5);

    // Parse boolean and numeric fields
    const updates = { ...req.body };
    if (updates.vaccinated !== undefined) updates.vaccinated = updates.vaccinated === 'true' || updates.vaccinated === true;
    if (updates.neutered !== undefined) updates.neutered = updates.neutered === 'true' || updates.neutered === true;
    if (updates.age !== undefined) updates.age = Number(updates.age) || 0;
    if (updates.adoptionFee !== undefined) updates.adoptionFee = Number(updates.adoptionFee) || 0;
    if (updates.temperament) {
      updates.temperament = Array.isArray(updates.temperament)
        ? updates.temperament
        : [updates.temperament];
    }

    updates.images = finalImages;

    // Keep track of the original images array to identify which ones were removed
    const originalImages = [...pet.images];

    // 3. Update MongoDB
    Object.assign(pet, updates);
    await pet.save();

    console.log(`[PetController] Pet updated successfully in DB: ${pet._id}`);

    // 4. Delete old removed S3 images from the bucket only AFTER successful database update
    const removedImages = originalImages.filter(img => !finalImages.includes(img));
    for (const imgUrl of removedImages) {
      await deleteFromS3(imgUrl);
    }

    const formattedPet = pet.toObject();
    formattedPet.id = formattedPet._id.toString();
    res.json(formattedPet);
  } catch (error) {
    console.error('[PetController] Error updating pet (triggering S3 rollback):', error);
    // Rollback: delete newly uploaded S3 files from this request
    for (const s3Url of newUploadedS3Urls) {
      await deleteFromS3(s3Url);
    }
    res.status(500).json({ message: 'Error updating pet', error: error.message });
  }
};

/**
 * DELETE /api/pets/:id
 * Delete a pet listing (Shelter/Admin only)
 */
export const deletePet = async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);
    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }

    // Verify ownership
    if (req.user.role !== 'admin' && pet.shelterId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this pet listing' });
    }

    // Store images list for S3 deletion
    const imagesToDelete = pet.images || [];

    // Delete from MongoDB first (database is source of truth, if deletion fails we don't delete files)
    await Pet.deleteOne({ _id: req.params.id });
    console.log(`[PetController] Pet deleted successfully from DB: ${req.params.id}`);

    // Clean up S3 assets after successful DB removal
    for (const imgUrl of imagesToDelete) {
      await deleteFromS3(imgUrl);
    }

    res.json({ message: 'Pet deleted successfully' });
  } catch (error) {
    console.error('[PetController] Error deleting pet:', error);
    res.status(500).json({ message: 'Error deleting pet', error: error.message });
  }
};

/**
 * PUT /api/pets/:id/status
 * Update status (available, adopted, pending)
 */
export const updatePetStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const pet = await Pet.findById(req.params.id);
    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }

    // Verify ownership
    if (req.user.role !== 'admin' && pet.shelterId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update status' });
    }

    pet.status = status;
    await pet.save();

    const formattedPet = pet.toObject();
    formattedPet.id = formattedPet._id.toString();

    res.json(formattedPet);
  } catch (error) {
    console.error('[PetController] Error updating pet status:', error);
    res.status(500).json({ message: 'Error updating pet status', error: error.message });
  }
};
