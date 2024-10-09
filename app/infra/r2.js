import { Random } from 'meteor/random';

const IMAGE_ALLOWED_TYPES = ['image/jpg', 'image/jpeg', 'image/png'];

const IMAGE_ACCEPT = IMAGE_ALLOWED_TYPES.map(
  (type) => `.${type.split('/')[1]}`
).join(', ');

const R2Directives = {
  AVATAR: {
    name: 'AVATAR',
    typeExpectedLabel: 'photo',
    allowedFileTypes: IMAGE_ALLOWED_TYPES,
    fileInputProps: {
      accept: IMAGE_ACCEPT,
    },
    folder: 'users',
    filePrefix: 'profile-avatar-',
  },
};

const {
  bucket,
  accountId,
  accessKey: accessKeyId,
  secretKey: secretAccessKey,
  region,
  cdn,
} = Meteor.settings?.devops?.r2 || {};

function checkFileAndGetExtension({ file, directive }) {
  const { typeExpectedLabel, allowedFileTypes } = directive;
  if (!allowedFileTypes.includes(file.type)) {
    throw new Error(
      `Invalid file type, we are expecting ${typeExpectedLabel} files (${allowedFileTypes
        .map((t) => t.split('/')[1])
        .join(',')}). Please try another one.`
    );
  }
  const fileExtension = file.name.split('.').pop();
  return fileExtension.toLowerCase();
}

const CLOUDFLARE_R2_ENDPOINT = `https://${accountId}.r2.cloudflarestorage.com`;

Object.values(R2Directives).forEach((directive) => {
  Slingshot.createDirective(directive.name, Slingshot.CloudflareR2, {
    bucket,
    accountId,
    AccessKeyId: accessKeyId,
    SecretAccessKey: secretAccessKey,
    region,
    endpoint: CLOUDFLARE_R2_ENDPOINT,
    cdn,
    allowedFileTypes: directive.allowedFileTypes,
    maxSize: directive.maxSize || 10 * 1024 * 1024,
    authorize() {
      if (!this.userId) {
        throw new Meteor.Error('not-logged-in', 'Please login to upload');
      }
      return true;
    },
    key(file) {
      const fileExtension = checkFileAndGetExtension({ directive, file });

      return `${directive.folder}/${this.userId}/${
        directive.filePrefix
      }${Random.secret(12)}.${fileExtension}`;
    },
  });
});
