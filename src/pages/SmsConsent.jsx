export default function SmsConsent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-amber-50 px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-700 px-8 py-10 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">
              La Bodeguita
            </p>
            <h1 className="mt-3 text-4xl font-bold">
              SMS Consent Policy
            </h1>
            <p className="mt-4 max-w-2xl text-base text-white/85">
              Esta pagina explica como obtenemos el consentimiento de nuestros clientes para
              recibir mensajes SMS de ofertas, promociones y notificaciones de mercancia nueva.
            </p>
          </div>

          <div className="px-8 py-8 space-y-8 text-slate-700">
            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-900">Como se obtiene el consentimiento</h2>
              <p>
                El consentimiento se obtiene de forma directa cuando el cliente proporciona su
                numero de telefono a nuestro personal en caja o en el area de registro de clientes
                y acepta recibir mensajes promocionales de La Bodeguita.
              </p>
              <p>
                El registro se realiza dentro de nuestro sistema interno de punto de venta y
                administracion de clientes. Solo se registran clientes que voluntariamente entregan
                su numero de telefono para recibir comunicaciones comerciales.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-900">Tipos de mensajes enviados</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Promociones y ofertas especiales</li>
                <li>Avisos de mercancia nueva</li>
                <li>Mensajes de novedades comerciales relacionadas con la tienda</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-900">Frecuencia de mensajes</h2>
              <p>
                La frecuencia puede variar segun la actividad comercial, promociones activas y la
                llegada de nueva mercancia.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-900">Costos del servicio</h2>
              <p>
                Pueden aplicarse tarifas de mensajes y datos segun el plan del operador movil del
                cliente.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-900">Como cancelar la suscripcion</h2>
              <p>
                El cliente puede cancelar la recepcion de mensajes en cualquier momento respondiendo
                <span className="font-bold text-slate-900"> STOP </span>
                al mensaje SMS recibido.
              </p>
              <p>
                Para ayuda o informacion adicional puede responder
                <span className="font-bold text-slate-900"> HELP </span>
                o contactar directamente con la tienda.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-900">Privacidad</h2>
              <p>
                La informacion de contacto del cliente se utiliza exclusivamente para comunicaciones
                relacionadas con La Bodeguita y no se vende ni se comparte con terceros para fines
                ajenos al servicio de mensajeria contratado.
              </p>
            </section>

            <section className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
              <p className="text-sm font-semibold text-amber-900 uppercase tracking-wide">
                Texto de consentimiento resumido
              </p>
              <p className="mt-2 text-slate-800">
                Al proporcionar su numero de telefono y aceptar recibir comunicaciones, el cliente
                autoriza a La Bodeguita a enviar mensajes SMS con ofertas, promociones y avisos de
                mercancia nueva. La frecuencia puede variar. Pueden aplicarse tarifas de mensajes y
                datos. Para cancelar, responda STOP. Para ayuda, responda HELP.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
