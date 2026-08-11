import { StrictMode, useEffect, useState } from 'react';
import { ButtonsConfig, Editor, InfoModal } from 'ketcher-react';
import { Ketcher, StructServiceProvider } from 'ketcher-core';

import 'ketcher-react/dist/index.css';

import { getStructServiceProvider } from './utils';
import { safePostMessage } from './utils/safePostMessage';

const getHiddenButtonsConfig = (): ButtonsConfig => {
  const searchParams = new URLSearchParams(window.location.search);
  const hiddenButtons = searchParams.get('hiddenControls');
  const isReadOnly =
    searchParams.get('readOnly') === 'true' ||
    searchParams.get('viewOnly') === 'true';

  const config: Record<string, { hidden: boolean }> = {};

  if (hiddenButtons) {
    hiddenButtons.split(',').forEach((button) => {
      if (button) config[button] = { hidden: true };
    });
  }

  if (isReadOnly) {
    const editingControls = [
      'bond',
      'atom',
      'period-table',
      'sgroup',
      'reaction-plus',
      'arrows',
      'reaction-mapping-tools',
      'rgroup',
      'shape',
      'text',
      'enhanced-stereo',
      'create-monomer',
      'templates',
    ];
    editingControls.forEach((btn) => {
      config[btn] = { hidden: true };
    });
  }

  return config as ButtonsConfig;
};

const App = () => {
  const hiddenButtonsConfig = getHiddenButtonsConfig();
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [structServiceProvider, setStructServiceProvider] =
    useState<StructServiceProvider | null>(null);
  useEffect(() => {
    getStructServiceProvider().then(setStructServiceProvider);
  }, []);

  if (!structServiceProvider) {
    return <div>Loading...</div>;
  }

  return (
    <StrictMode>
      <Editor
        errorHandler={(message: string) => {
          setHasError(true);
          setErrorMessage(message.toString());
        }}
        buttons={hiddenButtonsConfig}
        staticResourcesUrl={process.env.PUBLIC_URL}
        structServiceProvider={structServiceProvider}
        onInit={(ketcher: Ketcher) => {
          window.ketcher = ketcher;

          // postMessage bridge: allows cross-origin parent (e.g. Angular app) to request structures
          window.addEventListener('message', async (event: MessageEvent) => {
            if (!event.data || typeof event.data !== 'object') return;

            if (event.data.eventType === 'GET_STRUCTURE') {
              try {
                const [smiles, molfile] = await Promise.all([
                  ketcher.getSmiles().catch(() => ''),
                  ketcher.getMolfile('v2000').catch(() => ''),
                ]);
                safePostMessage({
                  eventType: 'STRUCTURE_RESPONSE',
                  smiles,
                  molfile,
                });
              } catch (err) {
                safePostMessage({
                  eventType: 'STRUCTURE_RESPONSE',
                  smiles: '',
                  molfile: '',
                  error: String(err),
                });
              }
            }

            if (event.data.eventType === 'SET_STRUCTURE') {
              try {
                await ketcher.setMolecule(
                  event.data.molfile || event.data.smiles || '',
                );
                if (event.data.doLayout !== false) {
                  await ketcher.layout().catch(() => undefined);
                }
              } catch (err) {
                console.error('Ketcher setMolecule error:', err);
              }
            }

            if (event.data.eventType === 'LAYOUT_STRUCTURE') {
              try {
                await ketcher.layout();
              } catch (err) {
                console.error('Ketcher layout error:', err);
              }
            }
          });

          safePostMessage({
            eventType: 'init',
          });
          window.scrollTo(0, 0);
        }}
      />
      {hasError && (
        <InfoModal
          message={errorMessage}
          close={() => {
            setHasError(false);

            // Focus on editor after modal is closed
            const cliparea: HTMLElement | null =
              document.querySelector('.cliparea');
            cliparea?.focus();
          }}
        />
      )}
    </StrictMode>
  );
};

export default App;
