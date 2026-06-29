import { useState, useEffect } from 'react';
import { rewardService } from '@/services/rewardService';
import Badge from '@/components/common/Badge';
import { formatDate } from '@/utils/formatters';

export default function BadgesPage() {
  const [loading, setLoading] = useState(true);
  const [rewardData, setRewardData] = useState(null);

  useEffect(() => {
    loadRewardStats();
  }, []);

  const loadRewardStats = async () => {
    try {
      setLoading(true);
      const data = await rewardService.getStats();
      setRewardData(data.data);
    } catch (error) {
      console.error('Failed to load reward stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-48 mb-6"></div>
        <div className="h-32 bg-slate-200 rounded-xl mb-6"></div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!rewardData) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Failed to load reward stats</p>
      </div>
    );
  }

  const { stats, badges } = rewardData;

  // Calculate progress percentage
  const getProgressPercentage = (current, target) => {
    return Math.min((current / target) * 100, 100);
  };

  // Group badges by category
  const adoptionBadges = badges.filter(b => b.category === 'adoption');
  const donationBadges = badges.filter(b => b.category === 'donation');
  const activityBadges = badges.filter(b => b.category === 'activity');
  const engagementBadges = badges.filter(b => b.category === 'engagement');

  return (
    <div className="bg-paw-pattern min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-2">Reward Badges</h1>
        <p className="text-slate-500 mb-6">Earn badges by caring for your pets and supporting shelters</p>

        {/* Points and Level Card */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6 mb-8 text-white shadow-card">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center md:text-left">
              <span className="text-sm font-medium opacity-90">Reward Points</span>
              <p className="text-4xl font-bold mt-1">{stats.rewardPoints}</p>
            </div>
            <div className="text-center md:text-left">
              <span className="text-sm font-medium opacity-90">Current Level</span>
              <p className="text-2xl font-bold mt-1">{stats.level}</p>
            </div>
            <div className="text-center md:text-left">
              <span className="text-sm font-medium opacity-90">Badges Unlocked</span>
              <p className="text-2xl font-bold mt-1">{badges.filter(b => b.unlocked).length} / {badges.length}</p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="bg-white rounded-2xl border p-6 mb-8 shadow-card">
          <h2 className="font-semibold text-lg mb-4">Your Progress</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-primary-50 to-white rounded-xl border border-primary-100">
              <p className="text-2xl font-bold text-primary-600">{stats.petsAdopted}</p>
              <p className="text-xs text-slate-500 mt-1">Pets Adopted</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-primary-50 to-white rounded-xl border border-primary-100">
              <p className="text-2xl font-bold text-primary-600">{stats.petsViewed}</p>
              <p className="text-xs text-slate-500 mt-1">Pets Viewed</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-primary-50 to-white rounded-xl border border-primary-100">
              <p className="text-2xl font-bold text-primary-600">{stats.wishlistCount}</p>
              <p className="text-xs text-slate-500 mt-1">Wishlist</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-primary-50 to-white rounded-xl border border-primary-100">
              <p className="text-2xl font-bold text-primary-600">{stats.donationCount}</p>
              <p className="text-xs text-slate-500 mt-1">Donations</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-primary-50 to-white rounded-xl border border-primary-100">
              <p className="text-2xl font-bold text-primary-600">₹{stats.totalDonation}</p>
              <p className="text-xs text-slate-500 mt-1">Total Donated</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-primary-50 to-white rounded-xl border border-primary-100">
              <p className="text-2xl font-bold text-primary-600">{stats.followUpCompleted}</p>
              <p className="text-xs text-slate-500 mt-1">Follow-ups</p>
            </div>
          </div>
        </div>

      {/* Adoption Badges */}
      {adoptionBadges.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold text-lg mb-4">Adoption Badges</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {adoptionBadges.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} getProgressPercentage={getProgressPercentage} />
            ))}
          </div>
        </div>
      )}

      {/* Donation Badges */}
      {donationBadges.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold text-lg mb-4">Donation Badges</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {donationBadges.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} getProgressPercentage={getProgressPercentage} />
            ))}
          </div>
        </div>
      )}

      {/* Activity Badges */}
      {activityBadges.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold text-lg mb-4">Activity Badges</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activityBadges.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} getProgressPercentage={getProgressPercentage} />
            ))}
          </div>
        </div>
      )}

      {/* Engagement Badges */}
      {engagementBadges.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold text-lg mb-4">Engagement Badges</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {engagementBadges.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} getProgressPercentage={getProgressPercentage} />
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

function BadgeCard({ badge, getProgressPercentage }) {
  const progress = badge.progress || { current: 0, target: 1 };
  const progressPercent = getProgressPercentage(progress.current, progress.target);
  const isUnlocked = badge.unlocked;

  return (
    <div
      className={`p-6 rounded-2xl border transition-smooth shadow-card hover:shadow-card-hover hover:-translate-y-1 ${
        isUnlocked
          ? 'bg-gradient-to-br from-primary-50 to-white border-primary-200'
          : 'bg-white opacity-70 border-slate-200'
      }`}
    >
      {/* Badge Name */}
      <h3 className="font-semibold text-lg text-slate-800 mb-2">{badge.name}</h3>

      {/* Description */}
      <p className="text-sm text-slate-600 leading-relaxed mb-4">{badge.description}</p>

      {/* Progress Bar */}
      {!isUnlocked && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-slate-500 mb-2 font-medium">
            <span>Progress</span>
            <span>{progress.current} / {progress.target}</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5">
            <div
              className="bg-primary-500 h-2.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            {progress.target - progress.current} more {progress.target - progress.current === 1 ? 'required' : 'required'}
          </p>
        </div>
      )}

      {/* Unlocked Status */}
      <div className="mt-4">
        {isUnlocked ? (
          <div className="flex items-center justify-between">
            <Badge variant="success">Unlocked</Badge>
            {badge.unlockedAt && (
              <span className="text-xs text-slate-500 font-medium">
                {formatDate(badge.unlockedAt)}
              </span>
            )}
          </div>
        ) : (
          <Badge variant="default">Locked</Badge>
        )}
      </div>
    </div>
  );
}
