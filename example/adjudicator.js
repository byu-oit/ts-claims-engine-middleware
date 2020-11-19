const {ClaimsAdjudicator, Concept, Relationships} = require('@byu-oit/ts-claims-engine')

const subjects = {
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
    relationships: [Relationships.EQ, Relationships.NE],
    qualifiers: ['age'],
    async getValue (id, qualifiers) {
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
    relationships: [Relationships.GT, Relationships.GTE, Relationships.LT, Relationships.LTE, Relationships.EQ, Relationships.NE],
    async getValue (id) {
      return subjects[id].age
    }
  })
]

module.exports = new ClaimsAdjudicator(concepts) // Export adjudicator instance
