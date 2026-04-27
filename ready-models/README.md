# Ready models (exports)

Fichiers générés par `notebooks/train_and_export.py` (ONNX, `*_label_map.json`, `*_metrics.json`).

Si vous avez entraîné sur un jeu factice (`notebooks/_smoke_dataset`), **ré-entraînez** avec vos vraies images sous `notebooks/archive` : `python train_and_export.py` (sans `--data-root` si `config.yaml` pointe sur `archive`).

- Ne pas versionner de gros binaires **sans** Git LFS (voir `.gitignore` à la racine).
- Pour réentraîner : conserver le jeu d’images ailleurs, puis relancer l’entraînement.

Intégration côté appli : charger ce dossier (ou une copie) depuis le service d’inférence ; le contrat JSON métier reste dans `src/.../ai-model/schema/`.
