export const EXAMPLE_CREATED_QUEUE_NAME = "example-created";

export const EXAMPLE_CREATED_JOB_NAME = "notify-creator";

export type ExampleCreatedJobData = {
  exampleId: string;
  name: string;
  createdById: string;
};
