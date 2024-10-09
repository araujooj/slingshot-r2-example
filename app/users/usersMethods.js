import { Meteor } from 'meteor/meteor';
import { UsersCollection } from './UsersCollection';

Meteor.methods({
  'user.updateAvatar': async function updateProfile({ avatar }) {
    const { userId } = this;

    if (!userId) {
      throw new Meteor.Error(
        'not-authorized',
        'You are not authorized to edit this profile'
      );
    }

    console.log('avatar:', avatar, userId);

    await UsersCollection.updateAsync(
      { _id: userId },
      {
        $set: {
          avatar,
        },
      }
    );
  },
});
