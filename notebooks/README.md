# Entraînement NutriFlow (nettoyage + train)

Fichiers :

- `clean_dataset.py` — vérifie / nettoie les dossiers `TRAIN` et `TEST` (`O` / `R`).
- `train_and_export.py` — entraîne et écrit ONNX + JSON dans `../ready-models/` (défaut, voir `config.yaml`).
- `config.yaml`, `config.example.yaml`, `requirements.txt`

Structure sous `archive/` :

```text
archive/
  TRAIN/O/   TRAIN/R/   TEST/O/   TEST/R/
```

```powershell
cd notebooks
pip install -r requirements.txt
py -3 clean_dataset.py --root ./archive
py -3 train_and_export.py
```
