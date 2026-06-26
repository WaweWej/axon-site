# The Last Shelter

**A browser game about social justice, survival, and the arguments we use to decide who lives.**

The cold is coming and the shelter has room for a few. Outside, more people than seats. You decide who gets in — then a council of voices makes you say *why*, out loud, with reasons you'd defend to the ones left in the snow.

It's a debate, not a quiz. There are no right answers. Every framework the game offers you — *save the most lives*, *treat every life equally*, *help the worst-off first*, *reward who contributes*, *protect your own* — is defended by serious thinkers and contradicted by others. The game only reflects back which one **you** reached for, and what it cost.

## The three themes

- **Survival** — hard scarcity. Seats are finite; choosing one person turns away another.
- **Social justice** — who *deserves* a seat? Need, merit, equality, vulnerability, loyalty. The game makes each of these visible and uncomfortable.
- **Debate** — after you choose, a council challenges you. You answer, they retort. Your answers map onto five ethical lenses and become a mirror at the end.

## Run locally

```bash
node server.cjs
# open http://localhost:8080
```

No build step, no dependencies, no tracking. One self-contained `index.html` — vanilla JS, a canvas ambience (drifting snow over a faint network), and a small state machine: **intro → brief → choose → debate → verdict**.

## How a round works

1. **Brief** — a scenario (the Long Winter, the Last Boat) with a fixed number of seats.
2. **Choose** — meet the applicants. Each has a role, a plea, and traits. Fill exactly the available seats.
3. **The Council** — questions are generated from *who you saved and who you skipped*. Saved a child but skipped the elderly? You'll answer for it. Every answer is tagged to an ethical lens.
4. **Verdict** — the fate of each person, the shape of your reasoning across the five lenses, and a closing reflection. Then play another night — the scenario rotates.

## Add a scenario

Scenarios live in the `SCENARIOS` array inside `index.html`. Each is:

```js
{
  id: "yourid",
  kicker: "Scenario · Title",
  title: "Headline",
  premise: "The setup paragraph.",
  capacity: 4,                     // seats
  survivors: [
    { name, role, plea, tags:[...], traits:[...] },
    // traits drive the council's questions:
    // child · old · useful · vulnerable · pregnant · disabled · danger · bond · care · alone
  ]
}
```

The council challenges in `buildChallenges()` fire on the traits present among the saved vs. skipped — so new survivors with familiar traits get debated automatically.

## Note

This is fiction built to provoke reflection, not to score anyone's worth. The hardest part of justice under scarcity is that decent people, reasoning carefully, still disagree.
