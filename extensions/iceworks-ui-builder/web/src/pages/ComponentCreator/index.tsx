import React, { useState } from 'react';
import { Notification, Button, Input } from '@alifd/next';
import Material from '@iceworks/material-ui';
import { LocaleProvider } from '@/i18n';
import { useIntl, FormattedMessage } from 'react-intl';
import callService from '../../callService';
import styles from './index.module.scss';

const Home = () => {
  const intl = useIntl();
  const [selectedBlock, setSelectedBlock] = useState({});
  const [componentName, setComponentName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  async function onSettingsClick() {
    try {
      await callService('common', 'openMaterialsSettings');
    } catch (e) {
      Notification.error({ content: e.message });
    }
  }

  async function getSources() {
    let sources = [];
    try {
      sources = await callService('material', 'getSourcesByProjectType');
    } catch (e) {
      Notification.error({
        content: intl.formatMessage({ id: 'web.iceworksUIBuilder.getMaterialError' }),
      });
    }
    return sources;
  }

  async function refreshSources() {
    await callService('material', 'cleanCache');
    return await getSources();
  }

  async function getData(source: string) {
    let data = {};
    try {
      data = await callService('material', 'getData', source);
    } catch (e) {
      Notification.error({
        content: intl.formatMessage({ id: 'web.iceworksUIBuilder.getDataError' }),
      });
    }
    console.log('getData', data);
    return data;
  }

  function validateData({ block, componentName: name }) {
    if (!name) {
      return intl.formatMessage({ id: 'web.iceworksUIBuilder.componentCreator.noComponentName' });
    }
    if (!block) {
      return intl.formatMessage({ id: 'web.iceworksUIBuilder.componentCreator.didNotSeletBlock' });
    }
    return '';
  }

  function onSelect(block) {
    setSelectedBlock(block);
  }

  function resetData() {
    setSelectedBlock(undefined);
    setComponentName('');
  }

  async function handleCreate() {
    const data = {
      block: selectedBlock,
      componentName,
    };

    const errorMessage = validateData(data);
    if (errorMessage) {
      Notification.error({ content: errorMessage });
      setIsCreating(false);
      return;
    }

    setIsCreating(true);
    let blockIndexPath = '';
    try {
      const distPaths = await callService('block', 'bulkGenerate', [
        {
          ...selectedBlock,
          name: componentName,
        },
      ]);
      blockIndexPath = distPaths[0];
    } catch (error) {
      Notification.error({ content: error.message });
      setIsCreating(false);
      throw error;
    }

    setIsCreating(false);
    resetData();

    const openFileAction = intl.formatMessage({ id: 'web.iceworksUIBuilder.componentCreator.openFile' });
    const selectedAction = await callService(
      'common',
      'showInformationMessage',
      intl.formatMessage(
        { id: 'web.iceworksUIBuilder.componentCreator.successCreateToPath' },
        { path: blockIndexPath },
      ),
      openFileAction,
    );
    if (selectedAction === openFileAction) {
      await callService('common', 'showTextDocument', blockIndexPath);
    }
  }
  return (
    <div className={styles.wrap}>
      <div className={styles.list}>
        <div className={styles.item}>
          <div className={styles.label}>
            <FormattedMessage id="web.iceworksUIBuilder.componentCreator.inputComponentName" />
          </div>
          <div className={styles.field}>
            <Input
              placeholder={intl.formatMessage({
                id: 'web.iceworksUIBuilder.inputComponentNamePlaceHolder',
              })}
              className={styles.pageNameInput}
              value={componentName}
              onChange={(value) => setComponentName(value)}
              disabled={isCreating}
            />
          </div>
        </div>
        <div className={styles.item}>
          <div className={styles.label}>
            <FormattedMessage id="web.iceworksUIBuilder.componentCreator.selectBlock" />
          </div>
          <div className={styles.select}>
            <Material
              disableLazyLoad
              getSources={getSources}
              refreshSources={refreshSources}
              onSettingsClick={onSettingsClick}
              getData={getData}
              onBlockClick={onSelect}
              selectedBlocks={selectedBlock ? [selectedBlock] : []}
              dataWhiteList={['blocks']}
            />
          </div>
        </div>
      </div>
      <div className={styles.opts}>
        <Button type="primary" loading={isCreating} onClick={handleCreate}>
          <FormattedMessage id="web.iceworksUIBuilder.componentCreator.generateComponent" />
        </Button>
      </div>
    </div>
  );
};

const IntlHome = () => {
  return (
    <LocaleProvider>
      <Home />
    </LocaleProvider>
  );
};

export default IntlHome;
