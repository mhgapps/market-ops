# Add eslint disable comments for necessary any types in invitation service
sed -i '' '99s/.*as any.*/        invited_by,\n        \/\/ eslint-disable-next-line @typescript-eslint\/no-explicit-any\n      } as any)/' src/services/invitation.service.ts
