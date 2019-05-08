// @format
import React, {Component} from 'react';
import Uppy from '@uppy/core';
import {Dashboard} from '@uppy/react';
import XHRUpload from '@uppy/xhr-upload';
import AwsS3 from '@uppy/aws-s3';
import axios from 'axios';
import uuidv4 from 'uuid/v4';

import '@uppy/core/dist/style.css';
import '@uppy/dashboard/dist/style.css';

const signer =
  'https://w4auswuf7f.execute-api.eu-central-1.amazonaws.com/dev/sign';

const jobsQueue =
  'https://s40xayw8v2.execute-api.eu-central-1.amazonaws.com/dev/jobs';

const s3 = 'https://s3.eu-central-1.amazonaws.com';

const infura = 'https://ipfs.infura.io';

class Uploader extends Component {
  constructor(props) {
    super(props);

    let folder;
    let allowedFileTypes = [];
    if (props.fileType === 'image') {
      folder = 'posters/';
      this.uppy = Uppy({
        meta: {type: 'avatar'},
        restrictions: {
          maxNumberOfFiles: 1,
          allowedFileTypes: ['image/*'],
        },
        autoProceed: true,
      });
      this.uppy.use(XHRUpload, {
        endpoint: `${infura}:5001/api/v0/add?pin=true`,
        formData: true,
        metaFields: [],
      });

      this.uppy.on('upload-success', (file, {body}) => {
        props.uploadStatus(null, `${infura}/ipfs/${body.Hash}`);
      });
    } else if (props.fileType === 'video') {
      folder = 'inputs/';
      this.uppy = Uppy({
        meta: {type: 'avatar'},
        restrictions: {
          maxNumberOfFiles: 1,
          allowedFileTypes: ['video/*'],
        },
        autoProceed: true,
      });
      this.uppy.use(AwsS3, {
        async getUploadParameters(file) {
          let data;
          const id = uuidv4();
          try {
            data = (await axios.post(signer, {
              // NOTE: A file name cannot contain chars like spaces, as
              // otherwise convertion will fail.
              filename: `${folder}${id}-${file.name.replace(
                /[^A-Za-z0-9\.]/g,
                '',
              )}`,
              contentType: file.type,
            })).data;
          } catch (err) {
            console.log(err);
            props.uploadStatus(err);
          }

          return {
            method: 'PUT',
            url: data.url,
            fields: data.fields,
            headers: {},
          };
        },
      });
      this.uppy.on('complete', result => {
        const {uploadURL, id} = result.successful[0];
        const file = this.uppy.getFile(id);
        const fileNameSplit = uploadURL.split('/');
        const fileName = fileNameSplit[fileNameSplit.length - 1];

        this.encodeMovie(id, fileName, file);
      });
    } else {
      throw new Error('FileType not supported');
    }
  }

  async encodeMovie(fileId, fileName, file) {
    const {uploadStatus, destinationBucket} = this.props;

    while (true) {
      // NOTE: When we query the lambda too much, we'll get 500 "Too Many
      // Requests" errors.
      await new Promise(resolve => setTimeout(() => resolve(), 500));
      let status;
      try {
        status = await this.fetchJob(fileName);
      } catch (err) {
        this.uppy.emit('upload-error', file, err);
        uploadStatus(err);
        return;
      }

      if (status === 'SUBMITTED') {
        this.uppy.emit('postprocess-progress', file, {
          mode: 'indeterminate',
          message: 'Submitted for encoding..',
        });
      } else if (status === 'PROGRESSING') {
        this.uppy.emit('postprocess-progress', file, {
          mode: 'indeterminate',
          message: 'Encoding...',
        });
      } else if (status === 'COMPLETE') {
        this.uppy.emit('postprocess-complete', file);
        const fileNameWithoutExt = fileName.split('.')[0];
        const urls = {
          hls: `${s3}/${destinationBucket}/${fileNameWithoutExt}/Default/HLS/${fileNameWithoutExt}.m3u8`,
          mp4: `${s3}/${destinationBucket}/${fileNameWithoutExt}/Default/MP4/${fileNameWithoutExt}.mp4`,
        };
        uploadStatus(null, urls);
        return;
      } else {
        const err = new Error('Encoding failed');
        this.uppy.emit('upload-error', file, err);
        uploadStatus(err);
        return;
      }
    }
  }

  async fetchJob(fileName) {
    let jobs;
    try {
      jobs = await (await axios.get(jobsQueue)).data.jobs;
    } catch (err) {
      // NOTE: We ignore 500s as they're likely "Too Many Requests" errors.
      if (err.message.indexOf('status code 500') >= 0) {
        return 'PROGRESSING';
      } else {
        throw err;
      }
    }
    jobs = jobs.filter(job => job.fileInput === fileName);

    if (jobs.length > 1) {
      // NOTE: This should never happen as we're using uuids
      throw new Error('Found two identical movies processing in queue');
    } else if (jobs.length == 0) {
      // NOTE: It takes a couple of seconds before the movie shows up in the
      // processing queue.
      return 'SUBMITTED';
    } else {
      const job = jobs[0];

      if (job.errorCode || job.errorMessage) {
        throw new Error(job.errorMessage);
      } else {
        return job.status;
      }
    }
  }

  render() {
    return (
      <Dashboard
        height={320}
        proudlyDisplayPoweredByUppy={false}
        showLinkToFileUploadResult={false}
        uppy={this.uppy}
      />
    );
  }
}

export default Uploader;
