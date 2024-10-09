import React, { useState } from 'react';
import { useLoggedUser } from 'meteor/quave:logged-user-react';
import { Loading } from './Loading';
import { useTracker } from 'meteor/react-meteor-data';

const DEFAULT_PROFILE_PICTURE = 'https://www.gravatar.com/avatar/0?d=mp&f=1';

async function uploadFileByDirective(directiveName, file, user) {
  const { Meteor } = await import('meteor/meteor');

  if (!user?._id || user?._id !== Meteor.userId()) {
    throw new Meteor.Error('You are not logged in');
  }

  if (!directiveName) {
    throw new Meteor.Error('The directive is required.');
  }

  const { Slingshot } = await import('meteor/quave:slingshot');

  const uploader = new Slingshot.Upload(directiveName);

  await uploader.validate(file);

  return new Promise((resolve, reject) => {
    uploader.send(file, (uploadError, fileUrl) => {
      if (uploadError) {
        reject(uploadError);
      } else {
        resolve(fileUrl);
      }
    });
  });
}

export const ProfileAvatar = () => {
  const { loggedUser: user } = useLoggedUser();

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState(
    user?.avatar ?? DEFAULT_PROFILE_PICTURE
  );

  const saveUploadedAvatar = (newAvatarUrl) =>
    Meteor.callAsync('user.updateAvatar', {
      avatar: newAvatarUrl,
    }).catch((err) => {
      console.error('Error when saving avatar', err);
    });

  const meteorUser = useTracker(() => Meteor.user(), []);

  console.log('meteorUser:', meteorUser);

  const uploadFile = async (event) => {
    try {
      setIsUploadingAvatar(true);
      const file = event.target.files[0];
      if (!file) {
        alert('Please select a file');
        return;
      }

      const newAvatarUrl = await uploadFileByDirective('AVATAR', file, user);
      await saveUploadedAvatar(newAvatarUrl);

      // Trick to force re-fetch on the browser.
      setUploadedAvatarUrl(`${newAvatarUrl}?date=${Date.now()}`);
    } catch (e) {
      console.error(e);
      alert('Error saving image, please try again');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center gap-1">
          {isUploadingAvatar ? (
            <Loading />
          ) : (
            <img
              className="rounded-16 h-14 w-14 object-cover"
              src={uploadedAvatarUrl}
              alt="user avatar"
            />
          )}
          <label
            htmlFor="fileInput"
            className={`text-tAction text-small ${isUploadingAvatar ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            Edit
          </label>
          <input
            type="file"
            id="fileInput"
            onChange={uploadFile}
            className="hidden"
            disabled={isUploadingAvatar}
          />
        </div>
        <div className="flex flex-col pb-6">
          <h6 className="text-h6 text-tHeadings">{user.emails[0].address}</h6>
        </div>
      </div>
      <div className="bg-bPrimary hidden h-[1px] sm:block" />
    </>
  );
};
