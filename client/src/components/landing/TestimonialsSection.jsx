const testimonials = [
  {
    quote: "They integrated ModMe into Jainandiyer client side to protect user profile and chat uploads dev don't have to build a moderation system from scratch.",
    author: "Jainandiyer",
    role: "Ecommerce food delivery application",
    metric: "Integrated upload protection",
  },
];

export default function TestimonialsSection() {
  const testimonial = testimonials[0];

  return (
    <section className="relative border-t border-foreground/10 py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="mb-16 flex items-center gap-4">
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Client note</span>
          <div className="h-px flex-1 bg-foreground/10" />
          <span className="font-mono text-xs text-muted-foreground">01 / 01</span>
        </div>

        <div className="grid gap-12 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-8">
            <blockquote>
              <p className="font-display text-4xl leading-[1.1] tracking-tight text-foreground md:text-5xl lg:text-6xl">
                "{testimonial.quote}"
              </p>
            </blockquote>

            <div className="mt-12 flex items-center gap-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-foreground/10 bg-foreground/5">
                <span className="font-display text-2xl text-foreground">{testimonial.author.charAt(0)}</span>
              </div>
              <div>
                <p className="text-lg font-medium text-foreground">{testimonial.author}</p>
                <p className="text-muted-foreground">{testimonial.role}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center lg:col-span-4">
            <div className="border border-foreground/10 p-8">
              <span className="mb-4 block font-mono text-xs uppercase tracking-widest text-muted-foreground">Use case</span>
              <p className="font-display text-3xl text-foreground md:text-4xl">{testimonial.metric}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
