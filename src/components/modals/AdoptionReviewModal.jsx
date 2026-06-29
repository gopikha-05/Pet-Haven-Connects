import { FiX } from 'react-icons/fi';

export default function AdoptionReviewModal({ application, onClose, onApprove, onReject, onRequestInfo }) {
  if (!application) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Adoption Application Review</h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <FiX size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Pet Information */}
          <div className="bg-primary-50 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-2">Pet Information</h3>
            <p><span className="font-medium">Pet Name:</span> {application.petName}</p>
            <p><span className="font-medium">Application ID:</span> {application.id}</p>
            <p><span className="font-medium">Submitted:</span> {new Date(application.submittedAt).toLocaleDateString()}</p>
          </div>

          {/* Personal Details */}
          <div>
            <h3 className="font-semibold text-lg mb-3 pb-2 border-b">Personal Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Full Name</p>
                <p className="font-medium">{application.fullName}</p>
              </div>
              <div>
                <p className="text-slate-500">Age</p>
                <p className="font-medium">{application.age}</p>
              </div>
              <div>
                <p className="text-slate-500">Phone</p>
                <p className="font-medium">{application.phone}</p>
              </div>
              <div>
                <p className="text-slate-500">Email</p>
                <p className="font-medium">{application.email}</p>
              </div>
              <div className="col-span-2">
                <p className="text-slate-500">Address</p>
                <p className="font-medium">{application.address}</p>
              </div>
              <div>
                <p className="text-slate-500">Occupation</p>
                <p className="font-medium">{application.occupation}</p>
              </div>
            </div>
          </div>

          {/* Suitability Details */}
          <div>
            <h3 className="font-semibold text-lg mb-3 pb-2 border-b">Suitability Details</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-500">Previous Pet Experience</p>
                <p className="font-medium capitalize">{application.previousPetExperience}</p>
              </div>
              <div>
                <p className="text-slate-500">Experience Explanation</p>
                <p className="font-medium">{application.experienceExplanation}</p>
              </div>
              <div>
                <p className="text-slate-500">Why they want to adopt</p>
                <p className="font-medium">{application.reason}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500">Home Type</p>
                  <p className="font-medium capitalize">{application.homeType}</p>
                </div>
                <div>
                  <p className="text-slate-500">Has Yard</p>
                  <p className="font-medium">{application.hasYard ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="text-slate-500">Existing Pets</p>
                  <p className="font-medium">{application.existingPets || 'None'}</p>
                </div>
                <div>
                  <p className="text-slate-500">Family Members</p>
                  <p className="font-medium">{application.familyMemberCount}</p>
                </div>
                <div>
                  <p className="text-slate-500">Daily Availability</p>
                  <p className="font-medium">{application.dailyAvailability} hours/day</p>
                </div>
                <div>
                  <p className="text-slate-500">Financial Readiness</p>
                  <p className="font-medium capitalize">{application.financialReadiness}</p>
                </div>
              </div>
              <div>
                <p className="text-slate-500">Veterinarian Reference</p>
                <p className="font-medium">{application.vetReference || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Home Image */}
          {application.homeImage && (
            <div>
              <h3 className="font-semibold text-lg mb-3 pb-2 border-b">Home Environment</h3>
              <div className="bg-slate-100 rounded-lg p-4 text-center">
                <p className="text-sm text-slate-500 mb-2">Home Image Uploaded</p>
                <div className="inline-block bg-white rounded-lg p-2 border">
                  <div className="w-48 h-32 bg-slate-200 rounded flex items-center justify-center text-slate-400 text-xs">
                    {application.homeImage}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Timeline */}
          {application.timeline && application.timeline.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-3 pb-2 border-b">Application Timeline</h3>
              <div className="space-y-2">
                {application.timeline.map((event, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-slate-400">{new Date(event.date).toLocaleDateString()}</span>
                    <span className="text-slate-600">
                      <span className="font-medium capitalize">{event.status.replace('_', ' ')}</span>
                      {' - '}{event.note}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {(application.status === 'pending' || application.status === 'under_review') && (
          <div className="sticky bottom-0 bg-white border-t p-4 flex gap-3">
            <button
              type="button"
              onClick={() => onRequestInfo?.(application.id)}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium"
            >
              Request More Info
            </button>
            <button
              type="button"
              onClick={() => onReject?.(application.id)}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
            >
              Reject
            </button>
            <button
              type="button"
              onClick={() => onApprove?.(application.id)}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              Approve
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
