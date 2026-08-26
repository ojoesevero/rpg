export const SKILLS = [
    {
        id: 'skill_preciso',
        name: 'Disparo Preciso',
        spCost: 10,
        description: 'Dano concentrado e crítico em um único disparo certeiro.',
        hits: [
            { damage: 45, sound: 'arrow_shot', delay: 0 }
        ]
    },
    {
        id: 'skill_duplo',
        name: 'Tiro Duplo',
        spCost: 15,
        description: 'Dispara duas flechas em rápida sucessão.',
        hits: [
            { damage: 20, sound: 'arrow_shot', delay: 0 },
            { damage: 20, sound: 'arrow_shot', delay: 200 }
        ]
    }
];
