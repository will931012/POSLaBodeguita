export default function SmsTerms() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-amber-50 px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-700 px-8 py-10 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">
              La Bodeguita
            </p>
            <h1 className="mt-3 text-4xl font-bold">
              SMS Terms and Conditions
            </h1>
            <p className="mt-4 max-w-2xl text-base text-white/85">
              These SMS Terms and Conditions describe the La Bodeguita messaging program operated
              by Pinero Miami Fragances LLC.
            </p>
          </div>

          <div className="px-8 py-8 space-y-8 text-slate-700">
            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-900">Program description</h2>
              <p>
                Customers who provide their phone number in store and agree to receive SMS messages
                may receive texts from La Bodeguita related to promotions, special offers, product
                availability, and occasional customer service follow-up.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-900">Consent to receive messages</h2>
              <p>
                By providing a mobile phone number and agreeing to receive messages, the customer
                consents to receive SMS communications from La Bodeguita. Consent is not a
                condition of purchase.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-900">Message frequency</h2>
              <p>
                Message frequency may vary depending on promotions, new product arrivals, and
                store activity.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-900">Message and data rates</h2>
              <p>
                Message and data rates may apply depending on the customer&apos;s mobile carrier
                and service plan.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-900">Opt-out</h2>
              <p>
                Customers can opt out at any time by replying
                <span className="font-bold text-slate-900"> STOP </span>
                to any SMS message received from La Bodeguita.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-900">Help</h2>
              <p>
                For assistance, reply
                <span className="font-bold text-slate-900"> HELP </span>
                to any message or contact the store directly.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-900">Carrier disclaimer</h2>
              <p>
                Carriers are not liable for delayed or undelivered messages.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-900">Privacy</h2>
              <p>
                Information collected as part of the SMS program is handled according to our
                Privacy Policy and is not sold or shared with third parties for their own
                marketing purposes.
              </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-sm text-slate-600">
                Last updated: March 18, 2026
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
