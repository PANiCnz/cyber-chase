Build: docker compose up --build -d

## Redeployment

On the deployment server, run this once to make the script executable:

```bash
chmod +x redeploy.sh
```

Redeploy the latest version with:

```bash
./redeploy.sh
```

The script stops the existing containers, retains a temporary rollback
copy, clones the latest repository, restores the full `data` directory
including chaser profiles and uploaded images, rebuilds without cache,
and starts the application. The rollback copy is removed only after the
new containers start successfully.
