import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { Inject, Logger } from '@nestjs/common';
import { FCM_OPTIONS } from '../fcm.constants';
import { FcmOptions } from '../interfaces/fcm-options.interface';
import * as firebaseAdmin from 'firebase-admin';

@Injectable()
export class FcmService {
  constructor(
    @Inject(FCM_OPTIONS) private fcmOptionsProvider: FcmOptions,
    private readonly logger: Logger,
  ) {
    if (firebaseAdmin.apps.length === 0) {
      firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert(
          this.fcmOptionsProvider.firebaseSpecsPath,
        ),
      });
    }
  }

  private readonly options = {
    priority: 'high',
    timeToLive: 60 * 60 * 24,
  };

  private readonly optionsSilent = {
    priority: 'high',
    timeToLive: 60 * 60 * 24,
    content_available: true,
  };

  /**
   *
   * @param deviceIds `all` is send to all devices
   * @param payload ref: firebaseAdmin.messaging.MessagingPayload
   * @param silent
   * @returns
   * */
  async sendNotification(
    deviceIds: Array<string>,
    payload: firebaseAdmin.messaging.MessagingPayload,
    silent: boolean,
  ) {
    if (deviceIds.length == 0) {
      throw new Error('You provide an empty device ids list!');
    }

    let result = null;
    try {
      result = await firebaseAdmin
        .messaging()
        .sendToDevice(
          deviceIds,
          payload,
          silent,
        );
    } catch (error) {
      this.logger.error(error.message, error.stackTrace, 'fcm-nestjs');
      throw error;
    }
    return result;
  }


  /**
   *
   * @param deviceIds `all` is send to all devices
   * @param title
   * @param body
   * @param options
   * @returns
   * */
  async sendNotificationToIOS(
      deviceIds: Array<string>,
      title: string,
      body: string,
      options: any,
  ){
    if (deviceIds.length == 0) {
      throw new Error('You provide an empty device ids list!');
    }
    let ios = {
      headers: {
        'apns-priority': options.priority ?? '10',
        'apns-expiration': options.expiration ?? '360000'
      },
      payload: {
        aps: {
          alert: {
            title: title,
            body: body,
          },
          badge: 1,
          sound: options.sound ?? 'default',
        }
      }
    }
    let message = {
      android: ios,
      token: deviceIds
    }
    let result = null;
    try {
      result = await firebaseAdmin
          .messaging()
          .send(message);
    } catch (error) {
      this.logger.error(error.message, error.stackTrace, 'fcm-nestjs');
      throw error;
    }
    return result;
  }


  /**
   *
   * @param deviceIds `all` is send to all devices
   * @param title
   * @param body
   * @param options
   * @returns
   * */
  async sendNotificationToAndroid(
      deviceIds: Array<string>,
      title: string,
      body: string,
      options: any,
  ){
    if (deviceIds.length == 0) {
      throw new Error('You provide an empty device ids list!');
    }

    let android = {
      priority: options.priority ?? "High", //mức độ ưu tiên khi push notification
      ttl: options.expiration ?? '360000',// hết hạn trong 1h
      data: {
        title: title,
        content: body
      }
    }

    let message = {
      android: android,
      token: deviceIds // token của thiết bị muốn push notification
    }

    let result = null;
    try {
      result = await firebaseAdmin
          .messaging()
          .send(message);
    } catch (error) {
      this.logger.error(error.message, error.stackTrace, 'fcm-nestjs');
      throw error;
    }
    return result;
  }

  /**
   *
   * @param deviceIds `all` is send to all devices
   * @param message
   * @returns
   * */
  async sendNotificationRawMessage(
      deviceIds: Array<string>,
      message: any
  ){
    if (deviceIds.length == 0) {
      throw new Error('You provide an empty device ids list!');
    }

    let result = null;
    try {
      result = await firebaseAdmin
          .messaging()
          .send({
            message: message,
            token: deviceIds
          });
    } catch (error) {
      this.logger.error(error.message, error.stackTrace, 'fcm-nestjs');
      throw error;
    }
    return result;
  }

  /**
   *
   * @param deviceIds `all` is send to all devices
   * @param topic
   * @returns
   * */
  async subscribeToTopic(
      deviceIds: Array<string>,
      topic: 'all' | string
  ){
    if (deviceIds.length == 0) {
      throw new Error('You provide an empty device ids list!');
    }

    let result = null;
    try {
      result = await firebaseAdmin
          .messaging()
          .subscribeToTopic(
              deviceIds,
              topic
          );
    }catch (error) {
      this.logger.error(error.message, error.stackTrace, 'fcm-nestjs');
      throw error;
    }

    return result;
  }

  /**
   *
   * @param deviceIds list devices
   * @param topic
   * @returns
   * */
  async unsubscribeFromTopic(
      deviceIds: Array<string>,
      topic: 'all' | string
  ) {
    if (deviceIds.length == 0) {
      throw new Error('You provide an empty device ids list!');
    }

    let result = null;
    try {
      result = await firebaseAdmin
          .messaging()
          .unsubscribeFromTopic(
              deviceIds,
              topic
          );
    }catch (error) {
      this.logger.error(error.message, error.stackTrace, 'fcm-nestjs');
      throw error;
    }

    return result;
  }

  /**
   *
   * @param topic `all` is send to all devices
   * @param payload ref: firebaseAdmin.messaging.MessagingPayload
   * @param silent
   * @returns
   */
  async sendToTopic(
    topic: 'all' | string,
    payload: firebaseAdmin.messaging.MessagingPayload,
    silent: boolean,
  ) {
    if (!topic && topic.trim().length === 0) {
      throw new Error('You provide an empty topic name!');
    }

    let result = null;
    try {
      result = await firebaseAdmin
        .messaging()
        .sendToTopic(
          topic,
          payload,
          silent,
        );
    } catch (error) {
      this.logger.error(error.message, error.stackTrace, 'fcm-nestjs');
      throw error;
    }
    return result;
  }

  /**
   *
   * @param deviceIds list devices
   * @param payload ref: firebaseAdmin.messaging.MessagingPayload
   * @param silent
   * @returns
   */
  async sendToDevice(
      deviceIds: Array<string>,
      payload: firebaseAdmin.messaging.MessagingPayload,
      silent: boolean,
  ) {
    if (deviceIds.length === 0) {
      throw new Error('You provide an empty device ids list!');
    }

    let result = null;
    try {
      result = await firebaseAdmin
          .messaging()
          .sendToDevice(
              deviceIds,
              payload,
              silent,
          );
    } catch (error) {
      this.logger.error(error.message, error.stackTrace, 'fcm-nestjs');
      throw error;
    }
    return result;
  }


  /**
   *
   * @param group
   * @param payload ref: firebaseAdmin.messaging.MessagingPayload
   * @param silent
   * @returns
   */
  async sendToDeviceGroup(
      group: string,
      payload: firebaseAdmin.messaging.MessagingPayload,
      silent: boolean,
  ) {
    if (group.length === 0) {
      throw new Error('You provide an empty device ids list!');
    }

    let result = null;
    try {
      result = await firebaseAdmin
          .messaging()
          .sendToDeviceGroup(
              group,
              payload,
              silent,
          );
    } catch (error) {
      this.logger.error(error.message, error.stackTrace, 'fcm-nestjs');
      throw error;
    }
    return result;
  }

  async sendToCondition(
      condition: string,
      payload: firebaseAdmin.messaging.MessagingPayload,
      silent: boolean,
  ) {
    if (condition.length === 0) {
      throw new Error('You provide an empty device ids list!');
    }

    let result = null;
    try {
      result = await firebaseAdmin
          .messaging()
          .sendToCondition(
              condition,
              payload,
              silent,
          );
    } catch (error) {
      this.logger.error(error.message, error.stackTrace, 'fcm-nestjs');
      throw error;
    }
    return result;
  }

  async sendMulticast(
      message: firebaseAdmin.messaging.MessagingPayload,
      dryRun: boolean,

  ) {
    let result = null;
    try {
      result = await firebaseAdmin
          .messaging()
          .sendMulticast(message, dryRun);
    } catch (error) {
      this.logger.error(error.message, error.stackTrace, 'fcm-nestjs');
      throw error;
    }
    return result;
  }

  async sendAll(
      messages: Array<firebaseAdmin.messaging.MessagingPayload>,
      dryRun: boolean,

  ) {
    let result = null;
    try {
      result = await firebaseAdmin
          .messaging()
          .sendAll(messages, dryRun);
    } catch (error) {
      this.logger.error(error.message, error.stackTrace, 'fcm-nestjs');
      throw error;
    }
    return result;
  }

  async send(
      message: firebaseAdmin.messaging.MessagingPayload,
      dryRun: boolean,

  ) {
    let result = null;
    try {
      result = await firebaseAdmin
          .messaging()
          .send(message, dryRun);
    } catch (error) {
      this.logger.error(error.message, error.stackTrace, 'fcm-nestjs');
      throw error;
    }
    return result;
  }
}
