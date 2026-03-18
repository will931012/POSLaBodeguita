export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-amber-50 px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-700 px-8 py-10 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">
              La Bodeguita
            </p>
            <h1 className="mt-3 text-4xl font-bold">
              Privacy Policy
            </h1>
            <p className="mt-4 max-w-2xl text-base text-white/85">
              This Privacy Policy explains how La Bodeguita, operated by Pinero Miami Fragances LLC,
              collects, uses, and protects customer information for in-store customer communication
              and SMS messaging.
            </p>
          </div>

          <div className="px-8 py-8 space-y-8 text-slate-700">
            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-900">Information we collect</h2>
              <p>
                We may collect a customer&apos;s mobile phone number when the customer voluntarily
                provides it in store and agrees to receive SMS messages. We may also maintain
                internal records related to consent, message delivery, and customer support.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-900">How we use information</h2>
              <p>
                We use customer phone numbers to send SMS messages related to promotions, product
                availability, store updates, and limited customer service follow-up. We may also
                use collected information to maintain records of consent and messaging preferences.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-900">SMS consent</h2>
              <p>
                SMS consent is collected directly in store when a customer provides a phone number
                and agrees to receive text messages from La Bodeguita. Consent is not transferred
                to third parties or unrelated brands.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-900">Sharing of information</h2>
              <p>
                We do not sell, rent, or share customer phone numbers with third parties for their
                own marketing purposes. We may use service providers that help us deliver messages
                or operate our systems, but customer information is used only to support our
                business communications.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-900">Data retention and security</h2>
              <p>
                We retain customer information only as needed for business operations, consent
                records, and compliance purposes. We use reasonable administrative and technical
                safeguards to protect stored customer information.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-900">Opt-out rights</h2>
              <p>
                Customers may opt out of SMS communications at any time by replying
                <span className="font-bold text-slate-900"> STOP </span>
                to any text message. Customers may reply
                <span className="font-bold text-slate-900"> HELP </span>
                for assistance.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-900">Contact</h2>
              <p>
                For privacy questions or support regarding our SMS program, customers may contact
                La Bodeguita directly in store or by calling the business phone number listed in
                our communications.
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
