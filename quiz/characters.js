module.exports = [
  {
    'attr': 'height',
    'prompt': (char) => {
      return `Which character is \`\`${char.height}\`\` tall?`
    }
  },
  {
    'attr': 'breastSize',
    'prompt': (char) => {
      return `Which character has a \`\`${char.breastSize}\`\` breast size?`
    }
  },
  {
    'attr': 'characterVoice',
    'prompt': (char) => {
      return `Which character is voiced by \`\`${char.characterVoice}\`\`?`
    }
  },
  {
    'attr': 'birthday',
    'prompt': (char) => {
      return `Which character has their birthday on \`\`${char.birthday}\`\`?`
    }
  },
  {
    'attr': 'school',
    'prompt': (char) => {
      return `Which character goes to \`\`${char.school.toLowerCase()}\`\`?`
    }
  },
  {
    'attr': 'schoolYear',
    'prompt': (char) => {
      return `Which character is in year \`\`${char.schoolYear.toLowerCase()}\`\`?`
    }
  },
  {
    'attr': 'hobby',
    'prompt': (char) => {
      return `Which character has a hobby of \`\`${char.hobby.toLowerCase()}\`\`?`
    }
  },
  {
    'attr': 'specialSkill',
    'prompt': (char) => {
      return `Which character has a special skill of \`\`${char.specialSkill.toLowerCase()}\`\`?`
    }
  },
  {
    'attr': 'favoriteFood',
    'prompt': (char) => {
      return `Which character\'s favorite food is \`\`${char.favoriteFood.toLowerCase()}\`\`?`
    }
  },
  {
    'attr': 'hatedFood',
    'prompt': (char) => {
      return `Which character doesn't like \`\`${char.hatedFood.toLowerCase()}\`\`?`
    }
  },
  {
    'attr': 'weak',
    'prompt': (char) => {
      return `Which character dislikes \`\`${char.weak.toLowerCase()}\`\`?`
    }
  },
]