Build: docker compose up --build -d

## Game Format

Cyber Chase uses a two-phase Final Chase format:

1. The contestant has two minutes to answer as many rapid-fire
   questions as possible. Each correct answer adds one step to the
   target.
2. The presenter starts the Chaser phase after the contestant timer
   expires.
3. The Chaser has two minutes to reach the contestant's target. Each
   correct answer moves the Chaser one step closer.
4. The Chaser wins immediately on reaching the target. If the Chaser
   timer expires first, the contestant wins.

Pushbacks are not used.

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
