import { vertexModelsQuery } from "@/lib/requests";
import { readSettings } from "@/lib/store/settings";
import { listVertexModels } from "@/lib/ai/vertex-models";
import { HTTP } from "@/lib/http-status";

// List the models that Vertex AI offers for a project and a location, for the model menu in
// Settings. The project and the location come from the form, which can be not saved yet.
export async function GET(request: Request) {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const query = vertexModelsQuery.safeParse(params);
  if (!query.success) {
    return Response.json({ error: query.error.issues[0].message }, { status: HTTP.badRequest });
  }
  const settings = await readSettings();
  const project =
    query.data.project || settings.vertex.projectId || settings.readAloud.googleProjectId;
  try {
    return Response.json(await listVertexModels(project, query.data.location));
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: HTTP.badGateway });
  }
}
