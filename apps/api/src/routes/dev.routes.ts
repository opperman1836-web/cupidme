import { Router, Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { logger } from '../utils/logger';

/**
 * Development-only routes. Mounted in server.ts only when NODE_ENV === 'development'.
 * NEVER expose in production.
 */
export const devRoutes = Router();

const DEMO_PROFILES = [
  {
    user_id: '11111111-1111-1111-1111-111111111111',
    email: 'demo.amara@cupidme.test',
    display_name: 'Amara',
    bio: 'Coffee addict, weekend hiker, always down for spontaneous road trips. Dogs > people (most days).',
    date_of_birth: '1998-03-14',
    gender: 'female',
    gender_preference: 'everyone',
    city: 'Cape Town',
    photos: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80',
    ],
  },
  {
    user_id: '22222222-2222-2222-2222-222222222222',
    email: 'demo.thabo@cupidme.test',
    display_name: 'Thabo',
    bio: 'Software engineer by day, jazz vinyl collector by night. Tell me your favorite album.',
    date_of_birth: '1995-07-22',
    gender: 'male',
    gender_preference: 'female',
    city: 'Johannesburg',
    photos: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&q=80',
    ],
  },
  {
    user_id: '33333333-3333-3333-3333-333333333333',
    email: 'demo.priya@cupidme.test',
    display_name: 'Priya',
    bio: 'Yoga instructor, foodie, and travel addict. Last adventure: solo backpacking in Vietnam.',
    date_of_birth: '1996-11-08',
    gender: 'female',
    gender_preference: 'everyone',
    city: 'Durban',
    photos: [
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&q=80',
    ],
  },
  {
    user_id: '44444444-4444-4444-4444-444444444444',
    email: 'demo.lerato@cupidme.test',
    display_name: 'Lerato',
    bio: 'Architect with a passion for botanical gardens and good wine. Love a deep conversation.',
    date_of_birth: '1994-02-19',
    gender: 'female',
    gender_preference: 'male',
    city: 'Pretoria',
    photos: [
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=800&q=80',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80',
    ],
  },
  {
    user_id: '55555555-5555-5555-5555-555555555555',
    email: 'demo.james@cupidme.test',
    display_name: 'James',
    bio: 'Surfer. Photographer. Chef when it matters. Looking for someone to share sunsets with.',
    date_of_birth: '1993-09-30',
    gender: 'male',
    gender_preference: 'female',
    city: 'Cape Town',
    photos: [
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80',
      'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=800&q=80',
    ],
  },
  {
    user_id: '66666666-6666-6666-6666-666666666666',
    email: 'demo.zara@cupidme.test',
    display_name: 'Zara',
    bio: 'Marketing strategist who secretly wants to be a novelist. Ask me about my bookshelf.',
    date_of_birth: '1997-05-11',
    gender: 'female',
    gender_preference: 'everyone',
    city: 'Johannesburg',
    photos: [
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&q=80',
      'https://images.unsplash.com/photo-1517365830460-955ce3ccd263?w=800&q=80',
    ],
  },
  {
    user_id: '77777777-7777-7777-7777-777777777777',
    email: 'demo.michael@cupidme.test',
    display_name: 'Michael',
    bio: 'Startup founder, trail runner, amateur mixologist. Swipe right if you appreciate a good negroni.',
    date_of_birth: '1991-12-03',
    gender: 'male',
    gender_preference: 'female',
    city: 'Cape Town',
    photos: [
      'https://images.unsplash.com/photo-1463453091185-61582044d556?w=800&q=80',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80',
    ],
  },
  {
    user_id: '88888888-8888-8888-8888-888888888888',
    email: 'demo.nadia@cupidme.test',
    display_name: 'Nadia',
    bio: 'Veterinarian who dreams in watercolor. Four dogs, one cat, zero regrets.',
    date_of_birth: '1995-08-24',
    gender: 'female',
    gender_preference: 'male',
    city: 'Stellenbosch',
    photos: [
      'https://images.unsplash.com/photo-1554151228-14d9def656e4?w=800&q=80',
      'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=800&q=80',
    ],
  },
];

/**
 * POST /api/dev/seed-profiles
 * Inserts (or upserts) demo users + profiles + photos.
 * Safe to run multiple times — uses upsert on user_id.
 */
devRoutes.post('/seed-profiles', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('[Dev] Seeding demo profiles...');

    let usersCount = 0;
    let profilesCount = 0;
    let photosCount = 0;
    const errors: string[] = [];

    for (const d of DEMO_PROFILES) {
      // 1. upsert users row
      const { error: userErr } = await supabaseAdmin
        .from('users')
        .upsert({
          id: d.user_id,
          email: d.email,
          is_active: true,
          is_verified: true,
        }, { onConflict: 'id' });

      if (userErr) {
        errors.push(`user ${d.display_name}: ${userErr.message}`);
        continue;
      }
      usersCount++;

      // 2. upsert profile
      const { error: profErr } = await supabaseAdmin
        .from('profiles')
        .upsert({
          user_id: d.user_id,
          display_name: d.display_name,
          bio: d.bio,
          date_of_birth: d.date_of_birth,
          gender: d.gender,
          gender_preference: d.gender_preference,
          city: d.city,
          country: 'ZA',
          profile_complete: true,
        }, { onConflict: 'user_id' });

      if (profErr) {
        errors.push(`profile ${d.display_name}: ${profErr.message}`);
        continue;
      }
      profilesCount++;

      // 3. clear old photos + insert new
      await supabaseAdmin.from('user_photos').delete().eq('user_id', d.user_id);
      const photoRows = d.photos.map((url, i) => ({
        user_id: d.user_id,
        url,
        position: i + 1,
        is_primary: i === 0,
      }));
      const { error: phErr } = await supabaseAdmin.from('user_photos').insert(photoRows);
      if (phErr) {
        errors.push(`photos ${d.display_name}: ${phErr.message}`);
        continue;
      }
      photosCount += photoRows.length;
    }

    logger.info('[Dev] Seed done', { usersCount, profilesCount, photosCount, errors });
    res.json({
      success: true,
      data: { usersCount, profilesCount, photosCount, errors },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/dev/seed-profiles
 * Removes all demo rows (user_ids 1-8).
 */
devRoutes.delete('/seed-profiles', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const ids = DEMO_PROFILES.map((d) => d.user_id);
    await supabaseAdmin.from('user_photos').delete().in('user_id', ids);
    await supabaseAdmin.from('user_interests').delete().in('user_id', ids);
    await supabaseAdmin.from('profiles').delete().in('user_id', ids);
    await supabaseAdmin.from('users').delete().in('id', ids);
    res.json({ success: true, message: 'Demo data removed' });
  } catch (err) {
    next(err);
  }
});
