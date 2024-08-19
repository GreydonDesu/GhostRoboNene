/**
 * @fileoverview Creates a Waitlist Queue for users to join and leave
 * @author Ai0796
 */

module.exports = {
    'INFO': {
        'name': 'waitlist',
        'utilization': '/waitlist',
        'description': 'creates a waitlist queue for users to join and leave',
        'ephemeral': false,
        'subcommands': [
            {
                'name': 'show',
                'description': 'Shows the current waitlist queue',
            },
            {
                'name': 'remove',
                'description': 'Get information on a specific tier on the leaderboard.',
                'params': [
                    {
                        'type': 'user',
                        'name': 'user',
                        'required': true,
                        'description': 'The user to remove'
                    }
                ]
            },
            {
                'name': 'clear',
                'description': 'Clears the waitlist queue'
            }
        ]
    },

    'CONSTANTS': {
        'NO_ACC_ERROR': {
            'type': 'Error',
            'message': 'This user has not linked their project sekai account with the bot.'
        }
    }
};