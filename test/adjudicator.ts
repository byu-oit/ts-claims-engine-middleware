import {ClaimsAdjudicator, Concept, Relationship} from "@byu-oit/ts-claims-engine"

interface MySubjects {
    [key: string]: {
        age: number,
        birth_date: string,
        height: number,
        favorite_color: string
    }
}

const subjects: MySubjects = {
    '123456789': {
        age: 23,
        birth_date: '1995-10-23',
        height: 5.5,
        favorite_color: 'blue'
    },
    '987654321': {
        age: 16,
        birth_date: '2000-07-11',
        height: 6.1,
        favorite_color: 'green'
    },
    '123456987': {
        age: 25,
        birth_date: '1993-09-10',
        height: 5.8,
        favorite_color: 'red'
    }
}

const concepts = [ // Create concepts
    Concept.Boolean({
        name: 'subject_exists',
        description: 'The subject exists',
        longDescription: 'Determines whether a subject is a known entity within the domain.',
        relationships: [Relationship.EQ, Relationship.NE],
        qualifiers: ['age'],
        getValue: async (id, qualifiers) => {
            if (qualifiers && qualifiers.age) {
                return subjects[id] !== undefined && subjects[id].age === qualifiers.age
            } else {
                return subjects[id] !== undefined
            }
        }
    }),
    Concept.Number({
        name: 'age',
        description: 'The subject is of age',
        longDescription: 'Determine if the subject is of an age',
        relationships: [Relationship.GT, Relationship.GTE, Relationship.LT, Relationship.LTE, Relationship.EQ, Relationship.NE],
        getValue: async (id) => subjects[id].age
    })
]

export default new ClaimsAdjudicator(concepts) // Export adjudicator instance
