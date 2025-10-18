import React from 'react';
import { Heart, Star, Share2, ExternalLink } from 'lucide-react';
import { useDonationStore } from '../store/donationStore';

export default function DonationScreen() {
  const { 
    totalDonated, 
    monthlyTotal, 
    donationCount, 
    isSupporter,
    addDonation 
  } = useDonationStore();

  const donationTiers = [
    { amount: 2, label: 'Coffee', description: 'Buy us a coffee' },
    { amount: 5, label: 'Lunch', description: 'Buy us lunch' },
    { amount: 10, label: 'Dinner', description: 'Buy us dinner' },
    { amount: 25, label: 'Sponsor', description: 'Monthly sponsor' },
  ];

  const handleDonate = (amount: number) => {
    // In a real app, this would integrate with a payment processor
    alert(`Donation of $${amount} would be processed here. This is a demo.`);
    addDonation(amount);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Support TheraJournal</h1>
        <p className="text-gray-600">Help us keep the app free and ad-free</p>
      </div>

      {/* Supporter Status */}
      {isSupporter() && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <Heart className="h-5 w-5 text-green-600" />
            <div className="ml-3">
              <h3 className="font-medium text-green-900">Thank you for your support!</h3>
              <p className="text-sm text-green-700">
                You're helping keep TheraJournal free for everyone.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Impact Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card text-center">
          <div className="text-2xl font-bold text-primary-600">${totalDonated}</div>
          <div className="text-sm text-gray-600">Total Donated</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-primary-600">${monthlyTotal}</div>
          <div className="text-sm text-gray-600">This Month</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-primary-600">{donationCount}</div>
          <div className="text-sm text-gray-600">Donations</div>
        </div>
      </div>

      {/* Why Support */}
      <div className="card mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Why Support TheraJournal?</h2>
        <div className="space-y-4">
          <div className="flex items-start">
            <Heart className="h-5 w-5 text-red-500 mt-0.5" />
            <div className="ml-3">
              <h3 className="font-medium text-gray-900">Privacy-First</h3>
              <p className="text-sm text-gray-600">
                Your data is encrypted on your device. We can't read your personal thoughts.
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <Heart className="h-5 w-5 text-red-500 mt-0.5" />
            <div className="ml-3">
              <h3 className="font-medium text-gray-900">Ad-Free Experience</h3>
              <p className="text-sm text-gray-600">
                No ads, no tracking, no distractions. Just pure journaling.
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <Heart className="h-5 w-5 text-red-500 mt-0.5" />
            <div className="ml-3">
              <h3 className="font-medium text-gray-900">Free AI Features</h3>
              <p className="text-sm text-gray-600">
                AI conversations and insights using completely free providers.
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <Heart className="h-5 w-5 text-red-500 mt-0.5" />
            <div className="ml-3">
              <h3 className="font-medium text-gray-900">Sustainable Development</h3>
              <p className="text-sm text-gray-600">
                Your support helps us maintain and improve the app.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Donation Tiers */}
      <div className="card mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose Your Support Level</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {donationTiers.map((tier) => (
            <button
              key={tier.amount}
              onClick={() => handleDonate(tier.amount)}
              className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-center"
            >
              <div className="text-2xl font-bold text-primary-600">${tier.amount}</div>
              <div className="font-medium text-gray-900">{tier.label}</div>
              <div className="text-sm text-gray-600">{tier.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="card mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Where Your Money Goes</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">AI Services (Groq)</span>
            <span className="font-medium">$15-20/month</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Database (Supabase)</span>
            <span className="font-medium">$0/month</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Hosting & Infrastructure</span>
            <span className="font-medium">$0/month</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Development & Maintenance</span>
            <span className="font-medium">Volunteer</span>
          </div>
          <hr className="my-2" />
          <div className="flex justify-between font-semibold">
            <span>Total Monthly Cost</span>
            <span>$15-25/month</span>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-4">
          For 1,000 active users. Your donations help us scale sustainably.
        </p>
      </div>

      {/* Alternative Support */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Other Ways to Support
        </h2>
        
        <div className="space-y-3">
          <button
            onClick={() => alert('Rate us on the App Store to help others discover TheraJournal!')}
            className="w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
          >
            <div className="flex items-center">
              <Star className="h-5 w-5 text-yellow-500" />
              <div className="ml-3">
                <h3 className="font-medium text-gray-900">Rate the App</h3>
                <p className="text-sm text-gray-600">Help others discover TheraJournal</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => alert('Share TheraJournal with friends who might benefit from journaling!')}
            className="w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
          >
            <div className="flex items-center">
              <Share2 className="h-5 w-5 text-purple-500" />
              <div className="ml-3">
                <h3 className="font-medium text-gray-900">Share with Friends</h3>
                <p className="text-sm text-gray-600">Help spread the word about privacy-first journaling</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}