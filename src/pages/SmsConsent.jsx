export default function SmsConsent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-amber-50 px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-700 px-8 py-10 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">
              Compassion and Love
            </p>
            <h1 className="mt-3 text-4xl font-bold">
              SMS Consent Policy
            </h1>
            <p className="mt-4 max-w-2xl text-base text-white/85">
              This page explains how Compassion and Love collects customer consent to receive
              SMS messages related to promotions, special offers, and new merchandise alerts.
            </p>
          </div>

          <div className="px-8 py-8 space-y-8 text-slate-700">
            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-900">How consent is collected</h2>
              <p>
                Consent is collected directly from the customer when they provide their mobile
                phone number to our staff during checkout or through our in-store customer
                registration process and agree to receive promotional text messages from
                Compassion and Love.
              </p>
              <p>
                Customer information is entered into our internal point-of-sale and customer
                management system only after the customer voluntarily shares their phone number
                and agrees to receive marketing communications.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-900">Types of messages sent</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Special offers and promotions</li>
                <li>New merchandise announcements</li>
                <li>Store-related marketing updates</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-900">Message frequency</h2>
              <p>
                Message frequency may vary depending on current promotions, seasonal campaigns,
                and new inventory arrivals.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-900">Message and data rates</h2>
              <p>
                Message and data rates may apply depending on the customer&apos;s wireless carrier
                and mobile plan.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-900">How to opt out</h2>
              <p>
                Customers may opt out of receiving SMS messages at any time by replying
                <span className="font-bold text-slate-900"> STOP </span>
                to any message received from Compassion and Love.
              </p>
              <p>
                For help, customers may reply
                <span className="font-bold text-slate-900"> HELP </span>
                or contact the store directly.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-900">Privacy</h2>
              <p>
                Customer contact information is used only for communications related to
                Compassion and Love and is not sold or shared with third parties for unrelated
                marketing purposes.
              </p>
            </section>

            <section className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
              <p className="text-sm font-semibold text-amber-900 uppercase tracking-wide">
                Sample consent language
              </p>
              <p className="mt-2 text-slate-800">
                By providing your mobile phone number and agreeing to receive communications,
                you consent to receive SMS messages from Compassion and Love regarding offers,
                promotions, and new merchandise announcements. Message frequency may vary.
                Message and data rates may apply. Reply STOP to opt out. Reply HELP for help.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
