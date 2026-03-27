import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        datastoreTerms: resolve(__dirname, 'pages/datastore-terms.html'),
        ragTechnical: resolve(__dirname, 'pages/rag-technical.html'),
        uiTemplates: resolve(__dirname, 'pages/ui-templates.html'),
        objectFillin: resolve(__dirname, 'pages/object-fillin.html'),
        objectFillinTechnical: resolve(__dirname, 'pages/object-fillin-technical.html'),
        descriptionExtraction: resolve(__dirname, 'pages/description-extraction.html'),
        descriptionExtractionTechnical: resolve(__dirname, 'pages/description-extraction-technical.html'),
        cloudWorkflows: resolve(__dirname, 'pages/cloud-workflows.html'),
        catalogFillin: resolve(__dirname, 'pages/catalog-fillin.html'),
        catalogFillinTechnical: resolve(__dirname, 'pages/catalog-fillin-technical.html'),
        dynamicPrimitive: resolve(__dirname, 'pages/dynamic-primitive.html'),
        structureGeneration: resolve(__dirname, 'pages/structure-generation.html'),
        ketcherIntegration: resolve(__dirname, 'pages/ketcher-integration.html'),
        firestoreSchema: resolve(__dirname, 'pages/firestore-schema.html'),
      },
    },
  },
})
