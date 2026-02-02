"use client";

export default function NosotrasPage() {
  return (
    <main className="min-h-screen bg-background max-w-[520px] mx-auto px-4 py-6 pb-24">
      <h1 className="text-2xl font-bold text-primary mb-6">Nosotras</h1>

      <article className="max-w-none text-foreground space-y-4 text-sm leading-relaxed font-normal">
        <p>
          <strong>Comer es un acto político</strong>, aunque durante años nos hayan intentado convencer de lo contrario. Cada ingrediente que eliges apoya un modelo de mundo. En Taulapp hemos decidido posicionarnos.
        </p>

        <p>
          En un contexto de colapso climático, desigualdad y violencia institucionalizada, apostamos de forma clara por la compra de producto local. Nuestro orden de preferencia es simple y no negociable:
        </p>

        <ul className="list-disc pl-5 space-y-1 my-4">
          <li><strong>Cercanía real:</strong> tu barrio, tu mercado, tus productores.</li>
          <li><strong>España,</strong> fortaleciendo economías locales y proyectos de aquí.</li>
          <li><strong>Europa,</strong> solo cuando no exista una alternativa más próxima.</li>
        </ul>

        <p>Y lo decimos sin rodeos:</p>
        <p>
          Taulapp no recomienda ni recomendará productos de productores estadounidenses ni israelíes.<br />
          No colaboramos con gobiernos que sostienen guerras, ocupaciones y genocidios. La neutralidad, en estos casos, es complicidad.
        </p>

        <p>
          Defendemos una cocina diversa, global y abierta, sin fronteras culturales: platos de todo el mundo, para todas las personas. Opciones kosher, veganas, vegetarianas, halal, sin gluten y más.<br />
          La diversidad alimentaria no necesita explotación, colonialismo ni violencia para existir.
        </p>

        <p>
          Mirando al futuro, nuestro compromiso es aún mayor:<br />
          priorizar pequeños comercios, cooperativas, productores independientes y proyectos humanos, éticos y sostenibles. Queremos visibilizar a quienes cuidan la tierra, a las personas y al territorio, no a quienes maximizan beneficios a cualquier precio.
        </p>

        <p>
          También luchamos contra otro problema estructural: el desperdicio de comida.<br />
          Por eso Taulapp incluye un espacio de Ideas, para cocinar con lo que ya tienes en casa, aprovechar mejor los ingredientes y recibir consejos de conservación, especialmente si cocinas para ti sola o solo. Reducir residuos también es una forma de resistencia.
        </p>

        <p>
          Y aun así, no perdemos lo esencial:<br />
          <strong>La comida une, cuida y crea comunidad.</strong><br />
          Compartir la mesa sigue siendo uno de los mayores placeres que existen.
        </p>

        <p>
          Taulapp no quiere gustar a todo el mundo.<br />
          Quiere ser coherente.
        </p>

        <p>
          Porque elegir qué comes<br />
          es elegir a quién apoyas<br />
          y qué mundo decides no alimentar.
        </p>
      </article>
    </main>
  );
}
