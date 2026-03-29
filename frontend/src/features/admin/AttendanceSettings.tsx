// src/features/admin/AttendanceSettings.tsx

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import {
  Clock,
  ExternalLink,
  Loader2,
  MapPin,
  Navigation,
  Save,
  Search,
  Trash2,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  ATTENDANCE_SETTINGS_CONSTANTS,
  LOCATION_ACTION_OPTIONS,
  ATTENDANCE_SETTINGS_SCHEMA,
} from "@/constants/attendance-settings";
import {
  officeLocationService,
  OfficeLocationUpsertRequest,
} from "@/services/officeLocationService";

interface TimeFieldProps {
  control: any;
  name: string;
  label: string;
  description: string;
}

const TimeField: React.FC<TimeFieldProps> = ({
  control,
  name,
  label,
  description,
}) => (
  <FormField
    control={control}
    name={name}
    render={({ field }) => (
      <FormItem>
        <FormLabel className="font-medium text-primary">{label}</FormLabel>
        <FormControl>
          <Input type="time" {...field} />
        </FormControl>
        <FormDescription className="text-sm text-muted-foreground">
          {description}
        </FormDescription>
        <FormMessage className="text-xs font-medium" />
      </FormItem>
    )}
  />
);

interface NumberFieldProps {
  control: any;
  name: string;
  label: string;
  description: string;
  placeholder: string;
  suffix: string;
  min?: number;
  disabled?: boolean;
}

const NumberField: React.FC<NumberFieldProps> = ({
  control,
  name,
  label,
  description,
  placeholder,
  suffix,
  min = 0,
  disabled = false,
}) => (
  <FormField
    control={control}
    name={name}
    render={({ field }) => (
      <FormItem>
        <FormLabel className="font-medium text-foreground">{label}</FormLabel>
        <FormControl>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              name={field.name}
              ref={field.ref}
              onBlur={field.onBlur}
              value={typeof field.value === "number" ? field.value : 0}
              onChange={(e) => {
                const val = Number(e.target.value);
                field.onChange(Number.isNaN(val) ? 0 : val);
              }}
              placeholder={placeholder}
              min={min}
              disabled={disabled}
            />
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {suffix}
            </span>
          </div>
        </FormControl>
        <FormDescription className="text-sm text-muted-foreground">
          {description}
        </FormDescription>
        <FormMessage className="text-xs font-medium" />
      </FormItem>
    )}
  />
);

const attendanceSettingsSchema = z.object({
  shift1CheckIn: z
    .string()
    .min(ATTENDANCE_SETTINGS_SCHEMA.shift1CheckIn.minLength, {
      message: ATTENDANCE_SETTINGS_CONSTANTS.VALIDATION.REQUIRED_FIELD,
    })
    .regex(ATTENDANCE_SETTINGS_SCHEMA.shift1CheckIn.pattern, {
      message: ATTENDANCE_SETTINGS_CONSTANTS.VALIDATION.INVALID_TIME_FORMAT,
    }),
  shift1CheckOut: z
    .string()
    .min(ATTENDANCE_SETTINGS_SCHEMA.shift1CheckOut.minLength, {
      message: ATTENDANCE_SETTINGS_CONSTANTS.VALIDATION.REQUIRED_FIELD,
    })
    .regex(ATTENDANCE_SETTINGS_SCHEMA.shift1CheckOut.pattern, {
      message: ATTENDANCE_SETTINGS_CONSTANTS.VALIDATION.INVALID_TIME_FORMAT,
    }),
  shift2CheckIn: z
    .string()
    .min(ATTENDANCE_SETTINGS_SCHEMA.shift2CheckIn.minLength, {
      message: ATTENDANCE_SETTINGS_CONSTANTS.VALIDATION.REQUIRED_FIELD,
    })
    .regex(ATTENDANCE_SETTINGS_SCHEMA.shift2CheckIn.pattern, {
      message: ATTENDANCE_SETTINGS_CONSTANTS.VALIDATION.INVALID_TIME_FORMAT,
    }),
  shift2CheckOut: z
    .string()
    .min(ATTENDANCE_SETTINGS_SCHEMA.shift2CheckOut.minLength, {
      message: ATTENDANCE_SETTINGS_CONSTANTS.VALIDATION.REQUIRED_FIELD,
    })
    .regex(ATTENDANCE_SETTINGS_SCHEMA.shift2CheckOut.pattern, {
      message: ATTENDANCE_SETTINGS_CONSTANTS.VALIDATION.INVALID_TIME_FORMAT,
    }),
  gracePeriod: z.coerce
    .number()
    .min(ATTENDANCE_SETTINGS_SCHEMA.gracePeriod.min, {
      message: ATTENDANCE_SETTINGS_CONSTANTS.VALIDATION.MUST_BE_NON_NEGATIVE,
    })
    .max(ATTENDANCE_SETTINGS_SCHEMA.gracePeriod.max),
  earlyLeaveThreshold: z.coerce
    .number()
    .min(ATTENDANCE_SETTINGS_SCHEMA.earlyLeaveThreshold.min, {
      message: ATTENDANCE_SETTINGS_CONSTANTS.VALIDATION.MUST_BE_NON_NEGATIVE,
    })
    .max(ATTENDANCE_SETTINGS_SCHEMA.earlyLeaveThreshold.max),
  gpsEnabled: z.boolean(),
  latitude: z
    .string()
    .refine(
      (val) => {
        if (!val) {
          return true;
        }
        const num = parseFloat(val);
        return !isNaN(num);
      },
      { message: ATTENDANCE_SETTINGS_CONSTANTS.VALIDATION.DECIMAL_COORDINATE },
    )
    .refine(
      (val) => {
        if (!val) {
          return true;
        }
        const num = parseFloat(val);
        return (
          num >= ATTENDANCE_SETTINGS_SCHEMA.latitude.min &&
          num <= ATTENDANCE_SETTINGS_SCHEMA.latitude.max
        );
      },
      { message: ATTENDANCE_SETTINGS_CONSTANTS.VALIDATION.LATITUDE_RANGE },
    ),
  longitude: z
    .string()
    .refine(
      (val) => {
        if (!val) {
          return true;
        }
        const num = parseFloat(val);
        return !isNaN(num);
      },
      { message: ATTENDANCE_SETTINGS_CONSTANTS.VALIDATION.DECIMAL_COORDINATE },
    )
    .refine(
      (val) => {
        if (!val) {
          return true;
        }
        const num = parseFloat(val);
        return (
          num >= ATTENDANCE_SETTINGS_SCHEMA.longitude.min &&
          num <= ATTENDANCE_SETTINGS_SCHEMA.longitude.max
        );
      },
      { message: ATTENDANCE_SETTINGS_CONSTANTS.VALIDATION.LONGITUDE_RANGE },
    ),
  radius: z.coerce
    .number()
    .min(ATTENDANCE_SETTINGS_SCHEMA.radius.min, {
      message: ATTENDANCE_SETTINGS_CONSTANTS.VALIDATION.MUST_BE_POSITIVE,
    })
    .max(ATTENDANCE_SETTINGS_SCHEMA.radius.max, {
      message: ATTENDANCE_SETTINGS_CONSTANTS.VALIDATION.RADIUS_RANGE,
    }),
  locationAction: z.enum(["BLOCK", "NOTIFY", "WARN"]),
});

type AttendanceSettingsFormInput = z.input<typeof attendanceSettingsSchema>;
type AttendanceSettingsFormValues = z.output<typeof attendanceSettingsSchema>;

const QUERY_KEY_OFFICE_CONFIG = ["office-config"] as const;
const QUERY_KEY_OFFICE_LOCATIONS = ["office-locations"] as const;
const LOCATION_SEARCH_MIN_LENGTH = 2;
const LOCATION_SEARCH_LIMIT = 5;

type LocationSuggestion = {
  displayName: string;
  latitude: number;
  longitude: number;
};

type BranchLocationDraft = {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  radiusMeters: string;
  isActive: boolean;
};

export default function AttendanceSettings() {
  const queryClient = useQueryClient();
  const [mapSearchKeyword, setMapSearchKeyword] = React.useState("");
  const [mapSearchQuery, setMapSearchQuery] = React.useState("");
  const [isSearchingLocation, setIsSearchingLocation] = React.useState(false);
  const [locationSuggestions, setLocationSuggestions] = React.useState<
    LocationSuggestion[]
  >([]);
  const [branchLocationDraft, setBranchLocationDraft] =
    React.useState<BranchLocationDraft>({
      name: "",
      address: "",
      latitude: "",
      longitude: "",
      radiusMeters: String(
        ATTENDANCE_SETTINGS_CONSTANTS.DEFAULTS.BRANCH_RADIUS,
      ),
      isActive: true,
    });

  const form = useForm<
    AttendanceSettingsFormInput,
    unknown,
    AttendanceSettingsFormValues
  >({
    resolver: zodResolver(attendanceSettingsSchema),
    mode: "onChange",
    defaultValues: {
      shift1CheckIn: ATTENDANCE_SETTINGS_CONSTANTS.DEFAULTS.SHIFT_1_CHECK_IN,
      shift1CheckOut: ATTENDANCE_SETTINGS_CONSTANTS.DEFAULTS.SHIFT_1_CHECK_OUT,
      shift2CheckIn: ATTENDANCE_SETTINGS_CONSTANTS.DEFAULTS.SHIFT_2_CHECK_IN,
      shift2CheckOut: ATTENDANCE_SETTINGS_CONSTANTS.DEFAULTS.SHIFT_2_CHECK_OUT,
      gracePeriod: ATTENDANCE_SETTINGS_CONSTANTS.DEFAULTS.GRACE_PERIOD,
      earlyLeaveThreshold:
        ATTENDANCE_SETTINGS_CONSTANTS.DEFAULTS.EARLY_LEAVE_THRESHOLD,
      gpsEnabled: ATTENDANCE_SETTINGS_CONSTANTS.DEFAULTS.GPS_ENABLED,
      latitude: "",
      longitude: "",
      radius: ATTENDANCE_SETTINGS_CONSTANTS.DEFAULTS.RADIUS,
      locationAction: ATTENDANCE_SETTINGS_CONSTANTS.DEFAULTS
        .ACTION_ON_MISMATCH as "BLOCK" | "NOTIFY" | "WARN",
    },
  });

  const { data: officeConfig } = useQuery({
    queryKey: QUERY_KEY_OFFICE_CONFIG,
    queryFn: officeLocationService.getOfficeConfig,
  });

  const { data: officeLocations = [] } = useQuery({
    queryKey: QUERY_KEY_OFFICE_LOCATIONS,
    queryFn: officeLocationService.getOfficeLocations,
  });

  React.useEffect(() => {
    if (!officeConfig) {
      return;
    }

    form.setValue("latitude", String(officeConfig.latitude));
    form.setValue("longitude", String(officeConfig.longitude));
    form.setValue("radius", officeConfig.radiusMeters);
    form.setValue("gpsEnabled", true);

    // Set shift and grace period values
    if (officeConfig.shift1CheckIn) {
      form.setValue("shift1CheckIn", officeConfig.shift1CheckIn);
    }
    if (officeConfig.shift1CheckOut) {
      form.setValue("shift1CheckOut", officeConfig.shift1CheckOut);
    }
    if (officeConfig.shift2CheckIn) {
      form.setValue("shift2CheckIn", officeConfig.shift2CheckIn);
    }
    if (officeConfig.shift2CheckOut) {
      form.setValue("shift2CheckOut", officeConfig.shift2CheckOut);
    }
    if (officeConfig.gracePeriod !== undefined) {
      form.setValue("gracePeriod", officeConfig.gracePeriod);
    }
    if (officeConfig.earlyLeaveThreshold !== undefined) {
      form.setValue("earlyLeaveThreshold", officeConfig.earlyLeaveThreshold);
    }
  }, [officeConfig, form]);

  const updateOfficeConfigMutation = useMutation({
    mutationFn: officeLocationService.updateOfficeConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_OFFICE_CONFIG });
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_OFFICE_LOCATIONS });
    },
  });

  const createOfficeLocationMutation = useMutation({
    mutationFn: (payload: OfficeLocationUpsertRequest) =>
      officeLocationService.createOfficeLocation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_OFFICE_LOCATIONS });
    },
  });

  const deleteOfficeLocationMutation = useMutation({
    mutationFn: (id: number) => officeLocationService.deleteOfficeLocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_OFFICE_LOCATIONS });
    },
  });

  const onSubmit = async (data: AttendanceSettingsFormValues) => {
    const loadingToastId = toast.loading(
      ATTENDANCE_SETTINGS_CONSTANTS.TOAST.LOADING,
    );

    try {
      const latitude = Number(data.latitude);
      const longitude = Number(data.longitude);
      const radiusMeters = Number(data.radius);

      if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        throw new Error("INVALID_COORDINATE");
      }

      await updateOfficeConfigMutation.mutateAsync({
        latitude,
        longitude,
        radiusMeters,
        shift1CheckIn: data.shift1CheckIn,
        shift1CheckOut: data.shift1CheckOut,
        shift2CheckIn: data.shift2CheckIn,
        shift2CheckOut: data.shift2CheckOut,
        gracePeriod: data.gracePeriod,
        earlyLeaveThreshold: data.earlyLeaveThreshold,
      });

      toast.dismiss(loadingToastId);
      toast.success(ATTENDANCE_SETTINGS_CONSTANTS.TOAST.SUCCESS_TITLE, {
        description: ATTENDANCE_SETTINGS_CONSTANTS.TOAST.SUCCESS_DESC,
      });
    } catch (error) {
      toast.dismiss(loadingToastId);
      if (error instanceof Error && error.message === "INVALID_COORDINATE") {
        toast.error(ATTENDANCE_SETTINGS_CONSTANTS.TOAST.ERROR_TITLE, {
          description:
            ATTENDANCE_SETTINGS_CONSTANTS.VALIDATION.INVALID_COORDINATE,
        });
      } else if (error instanceof Error && error.message === "403") {
        toast.error(ATTENDANCE_SETTINGS_CONSTANTS.TOAST.ERROR_FORBIDDEN, {
          description: ATTENDANCE_SETTINGS_CONSTANTS.TOAST.ERROR_DESC,
        });
      } else {
        toast.error(ATTENDANCE_SETTINGS_CONSTANTS.TOAST.ERROR_TITLE, {
          description: ATTENDANCE_SETTINGS_CONSTANTS.TOAST.ERROR_DESC,
        });
      }
    }
  };

  const onUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Trình duyệt không hỗ trợ định vị.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMapSearchQuery("");
        setLocationSuggestions([]);
        form.setValue("latitude", String(position.coords.latitude), {
          shouldDirty: true,
        });
        form.setValue("longitude", String(position.coords.longitude), {
          shouldDirty: true,
        });
      },
      () => {
        toast.error("Không thể lấy vị trí hiện tại.");
      },
    );
  };

  const searchWithGoogleGeocoding = async (
    keyword: string,
    apiKey: string,
  ): Promise<LocationSuggestion[]> => {
    const endpoint = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(keyword)}&key=${apiKey}`;
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error("GOOGLE_GEOCODING_FAILED");
    }

    const data: {
      results?: Array<{
        formatted_address?: string;
        geometry?: { location?: { lat?: number; lng?: number } };
      }>;
    } = await response.json();

    return (data.results ?? [])
      .map((item) => ({
        displayName: item.formatted_address ?? "",
        latitude: Number(item.geometry?.location?.lat),
        longitude: Number(item.geometry?.location?.lng),
      }))
      .filter(
        (item) =>
          item.displayName.length > 0 &&
          !Number.isNaN(item.latitude) &&
          !Number.isNaN(item.longitude),
      )
      .slice(0, LOCATION_SEARCH_LIMIT);
  };

  const searchWithNominatim = async (
    keyword: string,
  ): Promise<LocationSuggestion[]> => {
    const endpoint = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=${LOCATION_SEARCH_LIMIT}&q=${encodeURIComponent(keyword)}`;
    const response = await fetch(endpoint, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("NOMINATIM_SEARCH_FAILED");
    }

    const data: Array<{ display_name?: string; lat?: string; lon?: string }> =
      await response.json();

    return data
      .map((item) => ({
        displayName: item.display_name ?? "",
        latitude: Number(item.lat),
        longitude: Number(item.lon),
      }))
      .filter(
        (item) =>
          item.displayName.length > 0 &&
          !Number.isNaN(item.latitude) &&
          !Number.isNaN(item.longitude),
      );
  };

  const onSelectLocationSuggestion = (suggestion: LocationSuggestion) => {
    setMapSearchKeyword(suggestion.displayName);
    setMapSearchQuery(suggestion.displayName);
    setLocationSuggestions([]);
    setBranchLocationDraft((prev) => ({
      ...prev,
      address: suggestion.displayName,
      latitude: String(suggestion.latitude),
      longitude: String(suggestion.longitude),
    }));
    form.setValue("latitude", String(suggestion.latitude), {
      shouldDirty: true,
    });
    form.setValue("longitude", String(suggestion.longitude), {
      shouldDirty: true,
    });
  };

  const onSearchMapLocation = () => {
    const keyword = mapSearchKeyword.trim();
    if (!keyword) {
      toast.error(
        ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES.MAP_SEARCH
          .TOAST_ENTER_LOCATION,
      );
      return;
    }

    if (keyword.length < LOCATION_SEARCH_MIN_LENGTH) {
      toast.error(
        `${ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES.MAP_SEARCH.TOAST_MIN_LENGTH_PREFIX} ${LOCATION_SEARCH_MIN_LENGTH} ${ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES.MAP_SEARCH.TOAST_MIN_LENGTH_SUFFIX}`,
      );
      return;
    }

    setIsSearchingLocation(true);
    const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as
      | string
      | undefined;

    const searchPromise = googleMapsApiKey
      ? searchWithGoogleGeocoding(keyword, googleMapsApiKey)
      : searchWithNominatim(keyword);

    searchPromise
      .then((results) => {
        if (results.length === 0) {
          toast.error(
            ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES.MAP_SEARCH
              .TOAST_NOT_FOUND,
          );
          setLocationSuggestions([]);
          return;
        }
        setMapSearchQuery(keyword);
        setLocationSuggestions(results);
      })
      .catch(() => {
        toast.error(
          ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES.MAP_SEARCH
            .TOAST_SEARCH_ERROR,
        );
      })
      .finally(() => {
        setIsSearchingLocation(false);
      });
  };

  const resetBranchLocationDraft = () => {
    setBranchLocationDraft({
      name: "",
      address: "",
      latitude: "",
      longitude: "",
      radiusMeters: String(
        ATTENDANCE_SETTINGS_CONSTANTS.DEFAULTS.BRANCH_RADIUS,
      ),
      isActive: true,
    });
  };

  const onCreateBranchLocation = async () => {
    const name = branchLocationDraft.name.trim();
    const address = branchLocationDraft.address.trim();
    const latitude = Number(branchLocationDraft.latitude);
    const longitude = Number(branchLocationDraft.longitude);
    const radiusMeters = Number(branchLocationDraft.radiusMeters);

    if (!name) {
      toast.error(
        ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES.BRANCH_LOCATIONS
          .TOAST_PLEASE_ENTER_NAME,
      );
      return;
    }

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      toast.error(ATTENDANCE_SETTINGS_CONSTANTS.VALIDATION.INVALID_COORDINATE);
      return;
    }

    if (
      latitude < ATTENDANCE_SETTINGS_SCHEMA.latitude.min ||
      latitude > ATTENDANCE_SETTINGS_SCHEMA.latitude.max ||
      longitude < ATTENDANCE_SETTINGS_SCHEMA.longitude.min ||
      longitude > ATTENDANCE_SETTINGS_SCHEMA.longitude.max
    ) {
      toast.error(ATTENDANCE_SETTINGS_CONSTANTS.VALIDATION.INVALID_COORDINATE);
      return;
    }

    if (
      Number.isNaN(radiusMeters) ||
      radiusMeters < ATTENDANCE_SETTINGS_SCHEMA.radius.min ||
      radiusMeters > ATTENDANCE_SETTINGS_SCHEMA.radius.max
    ) {
      toast.error(ATTENDANCE_SETTINGS_CONSTANTS.VALIDATION.RADIUS_RANGE);
      return;
    }

    try {
      await createOfficeLocationMutation.mutateAsync({
        name,
        address,
        latitude,
        longitude,
        radiusMeters,
        isActive: branchLocationDraft.isActive,
      });

      resetBranchLocationDraft();
      toast.success(
        ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES.BRANCH_LOCATIONS
          .TOAST_ADD_SUCCESS,
      );
    } catch {
      toast.error(
        ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES.BRANCH_LOCATIONS
          .TOAST_ADD_ERROR,
      );
    }
  };

  const onDeleteOfficeLocation = async (officeId: number) => {
    const confirmed = window.confirm(
      ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES.BRANCH_LOCATIONS
        .CONFIRM_DELETE,
    );
    if (!confirmed) {
      return;
    }

    try {
      await deleteOfficeLocationMutation.mutateAsync(officeId);
      toast.success(
        ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES.BRANCH_LOCATIONS
          .TOAST_DELETE_SUCCESS,
      );
    } catch {
      toast.error(
        ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES.BRANCH_LOCATIONS
          .TOAST_DELETE_ERROR,
      );
    }
  };

  const latitude = Number(form.watch("latitude"));
  const longitude = Number(form.watch("longitude"));
  const hasValidCoordinates =
    !Number.isNaN(latitude) &&
    !Number.isNaN(longitude) &&
    latitude >= ATTENDANCE_SETTINGS_SCHEMA.latitude.min &&
    latitude <= ATTENDANCE_SETTINGS_SCHEMA.latitude.max &&
    longitude >= ATTENDANCE_SETTINGS_SCHEMA.longitude.min &&
    longitude <= ATTENDANCE_SETTINGS_SCHEMA.longitude.max;

  const googleMapsEmbedUrl = mapSearchQuery
    ? `https://maps.google.com/maps?q=${encodeURIComponent(mapSearchQuery)}&z=16&output=embed`
    : hasValidCoordinates
      ? `https://maps.google.com/maps?q=${latitude},${longitude}&z=16&output=embed`
      : "https://maps.google.com/maps?q=10.80374375,106.6896745&z=14&output=embed";

  const handleReset = () => {
    form.reset({
      shift1CheckIn: ATTENDANCE_SETTINGS_CONSTANTS.DEFAULTS.SHIFT_1_CHECK_IN,
      shift1CheckOut: ATTENDANCE_SETTINGS_CONSTANTS.DEFAULTS.SHIFT_1_CHECK_OUT,
      shift2CheckIn: ATTENDANCE_SETTINGS_CONSTANTS.DEFAULTS.SHIFT_2_CHECK_IN,
      shift2CheckOut: ATTENDANCE_SETTINGS_CONSTANTS.DEFAULTS.SHIFT_2_CHECK_OUT,
      gracePeriod: ATTENDANCE_SETTINGS_CONSTANTS.DEFAULTS.GRACE_PERIOD,
      earlyLeaveThreshold:
        ATTENDANCE_SETTINGS_CONSTANTS.DEFAULTS.EARLY_LEAVE_THRESHOLD,
      gpsEnabled: ATTENDANCE_SETTINGS_CONSTANTS.DEFAULTS.GPS_ENABLED,
      latitude: "",
      longitude: "",
      radius: ATTENDANCE_SETTINGS_CONSTANTS.DEFAULTS.RADIUS,
      locationAction: ATTENDANCE_SETTINGS_CONSTANTS.DEFAULTS
        .ACTION_ON_MISMATCH as "BLOCK" | "NOTIFY" | "WARN",
    });
  };

  return (
    <main className="flex-1 space-y-6 p-4 md:p-8 pt-6 bg-background min-h-screen">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="page-heading">
            {ATTENDANCE_SETTINGS_CONSTANTS.PAGE.TITLE}
          </h1>
          <p className="text-sm text-muted-foreground">
            {ATTENDANCE_SETTINGS_CONSTANTS.PAGE.DESCRIPTION}
          </p>
        </div>
        <div className="flex items-center gap-2"></div>
      </div>

      <Tabs defaultValue="time" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="time" className="gap-2">
            <Clock className="h-4 w-4" />
            {ATTENDANCE_SETTINGS_CONSTANTS.TABS.TIME_RULES}
          </TabsTrigger>
          <TabsTrigger value="location" className="gap-2">
            <MapPin className="h-4 w-4" />
            {ATTENDANCE_SETTINGS_CONSTANTS.TABS.LOCATION_RULES}
          </TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <TabsContent value="time" className="mt-6">
              <Card className="shadow-sm">
                <CardHeader className="pb-4 border-b mb-6">
                  <div className="flex items-center gap-3">
                    <div className="icon-box-sm bg-primary/10">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold leading-none tracking-tight">
                        {ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES.SECTION_TITLE}
                      </CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">
                        {ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES.SECTION_DESC}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-0">
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Ca 1 */}
                    <div className="col-span-1 md:col-span-2 space-y-4 rounded-lg border p-4 bg-slate-50/50 dark:bg-slate-900/50">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                          1
                        </span>
                        <span className="font-medium text-foreground">
                          {
                            ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES.SHIFT_1
                              .LABEL
                          }
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <TimeField
                          control={form.control}
                          name="shift1CheckIn"
                          label={
                            ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES.SHIFT_1
                              .CHECK_IN.LABEL
                          }
                          description={
                            ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES.SHIFT_1
                              .CHECK_IN.DESCRIPTION
                          }
                        />
                        <TimeField
                          control={form.control}
                          name="shift1CheckOut"
                          label={
                            ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES.SHIFT_1
                              .CHECK_OUT.LABEL
                          }
                          description={
                            ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES.SHIFT_1
                              .CHECK_OUT.DESCRIPTION
                          }
                        />
                      </div>
                    </div>

                    {/* Ca 2 */}
                    <div className="col-span-1 md:col-span-2 space-y-4 rounded-lg border p-4 bg-slate-50/50 dark:bg-slate-900/50">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                          2
                        </span>
                        <span className="font-medium text-foreground">
                          {
                            ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES.SHIFT_2
                              .LABEL
                          }
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <TimeField
                          control={form.control}
                          name="shift2CheckIn"
                          label={
                            ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES.SHIFT_2
                              .CHECK_IN.LABEL
                          }
                          description={
                            ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES.SHIFT_2
                              .CHECK_IN.DESCRIPTION
                          }
                        />
                        <TimeField
                          control={form.control}
                          name="shift2CheckOut"
                          label={
                            ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES.SHIFT_2
                              .CHECK_OUT.LABEL
                          }
                          description={
                            ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES.SHIFT_2
                              .CHECK_OUT.DESCRIPTION
                          }
                        />
                      </div>
                    </div>

                    <NumberField
                      control={form.control}
                      name="gracePeriod"
                      label={
                        ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES.GRACE_PERIOD
                          .LABEL
                      }
                      description={
                        ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES.GRACE_PERIOD
                          .DESCRIPTION
                      }
                      placeholder={
                        ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES.GRACE_PERIOD
                          .PLACEHOLDER
                      }
                      suffix={
                        ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES.GRACE_PERIOD
                          .SUFFIX
                      }
                    />

                    <NumberField
                      control={form.control}
                      name="earlyLeaveThreshold"
                      label={
                        ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES
                          .EARLY_LEAVE_THRESHOLD.LABEL
                      }
                      description={
                        ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES
                          .EARLY_LEAVE_THRESHOLD.DESCRIPTION
                      }
                      placeholder={
                        ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES
                          .EARLY_LEAVE_THRESHOLD.PLACEHOLDER
                      }
                      suffix={
                        ATTENDANCE_SETTINGS_CONSTANTS.TIME_RULES
                          .EARLY_LEAVE_THRESHOLD.SUFFIX
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="location" className="mt-6">
              <Card className="shadow-sm">
                <CardHeader className="pb-4 border-b mb-6">
                  <div className="flex items-center gap-3">
                    <div className="icon-box-sm bg-primary/10">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold leading-none tracking-tight">
                        {
                          ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES
                            .SECTION_TITLE
                        }
                      </CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">
                        {
                          ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES
                            .SECTION_DESC
                        }
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-0">
                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="gpsEnabled"
                      render={({ field }) => (
                        <FormItem className="col-span-1 md:col-span-2 space-y-4 rounded-lg border p-4 bg-slate-50/50 dark:bg-slate-900/50">
                          <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base font-medium text-foreground">
                                {
                                  ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES
                                    .GPS_ENABLED.LABEL
                                }
                              </FormLabel>
                              <FormDescription className="text-sm text-muted-foreground">
                                {field.value
                                  ? ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES
                                      .GPS_ENABLED.ENABLED
                                  : ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES
                                      .GPS_ENABLED.DISABLED}
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </div>
                          <FormDescription className="setting-description mt-2">
                            {
                              ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES
                                .GPS_ENABLED.DESCRIPTION
                            }
                          </FormDescription>
                          <FormMessage className="text-xs font-medium" />
                        </FormItem>
                      )}
                    />

                    <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-4 rounded-lg border p-4 bg-slate-50/50 dark:bg-slate-900/50">
                      <FormField
                        control={form.control}
                        name="latitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-medium text-foreground">
                              {
                                ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES
                                  .COORDINATES.LATITUDE.LABEL
                              }
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="font-mono"
                                placeholder={
                                  ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES
                                    .COORDINATES.LATITUDE.PLACEHOLDER
                                }
                                disabled={!form.watch("gpsEnabled")}
                              />
                            </FormControl>
                            <FormDescription className="text-sm text-muted-foreground">
                              {
                                ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES
                                  .COORDINATES.LATITUDE.DESCRIPTION
                              }
                            </FormDescription>
                            <FormMessage className="text-xs font-medium" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="longitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-medium text-foreground">
                              {
                                ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES
                                  .COORDINATES.LONGITUDE.LABEL
                              }
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="font-mono"
                                placeholder={
                                  ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES
                                    .COORDINATES.LONGITUDE.PLACEHOLDER
                                }
                                disabled={!form.watch("gpsEnabled")}
                              />
                            </FormControl>
                            <FormDescription className="text-sm text-muted-foreground">
                              {
                                ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES
                                  .COORDINATES.LONGITUDE.DESCRIPTION
                              }
                            </FormDescription>
                            <FormMessage className="text-xs font-medium" />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="radius"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-medium text-foreground">
                            {
                              ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES
                                .RADIUS.LABEL
                            }
                          </FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                name={field.name}
                                ref={field.ref}
                                onBlur={field.onBlur}
                                value={
                                  typeof field.value === "number"
                                    ? field.value
                                    : 0
                                }
                                onChange={(event) => {
                                  const value = Number(event.target.value);
                                  field.onChange(
                                    Number.isNaN(value) ? 0 : (value as any),
                                  );
                                }}
                                placeholder={
                                  ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES
                                    .RADIUS.PLACEHOLDER
                                }
                                min={1}
                                disabled={!form.watch("gpsEnabled")}
                              />
                              <span className="text-sm text-muted-foreground whitespace-nowrap">
                                {
                                  ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES
                                    .RADIUS.SUFFIX
                                }
                              </span>
                            </div>
                          </FormControl>
                          <FormDescription className="text-sm text-muted-foreground">
                            {
                              ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES
                                .RADIUS.DESCRIPTION
                            }
                          </FormDescription>
                          <FormMessage className="text-xs font-medium" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="locationAction"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-medium text-foreground">
                            {
                              ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES
                                .ACTION_ON_MISMATCH.LABEL
                            }
                          </FormLabel>
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                              disabled={!form.watch("gpsEnabled")}
                            >
                              <SelectTrigger className="form-select">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {LOCATION_ACTION_OPTIONS.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormDescription className="text-sm text-muted-foreground">
                            {
                              ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES
                                .ACTION_ON_MISMATCH.DESCRIPTION
                            }
                          </FormDescription>
                          <FormMessage className="text-xs font-medium" />
                        </FormItem>
                      )}
                    />

                    <div className="col-span-1 md:col-span-2 space-y-4 rounded-lg border p-4 bg-slate-50/50 dark:bg-slate-900/50">
                      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 mb-3">
                        <Input
                          value={mapSearchKeyword}
                          onChange={(event) =>
                            setMapSearchKeyword(event.target.value)
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              onSearchMapLocation();
                            }
                          }}
                          placeholder={
                            ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES
                              .MAP_SEARCH.SEARCH_PLACEHOLDER
                          }
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={onSearchMapLocation}
                          disabled={isSearchingLocation}
                        >
                          {isSearchingLocation ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Search className="mr-2 h-4 w-4" />
                          )}
                          {
                            ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES
                              .MAP_SEARCH.SEARCH_BTN
                          }
                        </Button>
                      </div>

                      {locationSuggestions.length > 0 && (
                        <div className="mb-3 space-y-2 rounded-lg border p-2">
                          {locationSuggestions.map((suggestion) => (
                            <button
                              key={`${suggestion.displayName}-${suggestion.latitude}-${suggestion.longitude}`}
                              type="button"
                              className="w-full rounded-md border bg-background px-3 py-2 text-left text-sm hover:bg-accent"
                              onClick={() =>
                                onSelectLocationSuggestion(suggestion)
                              }
                            >
                              <span className="block font-medium">
                                {suggestion.displayName}
                              </span>
                              <span className="block text-xs text-muted-foreground">
                                {suggestion.latitude.toFixed(6)},{" "}
                                {suggestion.longitude.toFixed(6)}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={onUseCurrentLocation}
                          disabled={!form.watch("gpsEnabled")}
                        >
                          <Navigation className="mr-2 h-4 w-4" />
                          {
                            ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES
                              .MAP_SEARCH.USE_CURRENT_LOCATION
                          }
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            if (!hasValidCoordinates && !mapSearchQuery) {
                              toast.error(
                                ATTENDANCE_SETTINGS_CONSTANTS.VALIDATION
                                  .INVALID_COORDINATE,
                              );
                              return;
                            }
                            const mapsQuery =
                              mapSearchQuery || `${latitude},${longitude}`;
                            window.open(
                              `https://www.google.com/maps?q=${encodeURIComponent(mapsQuery)}`,
                              "_blank",
                            );
                          }}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          {
                            ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES
                              .MAP_SEARCH.OPEN_GOOGLE_MAPS
                          }
                        </Button>
                      </div>

                      <div className="overflow-hidden rounded-xl border bg-white">
                        <iframe
                          title="Google Maps Preview"
                          src={googleMapsEmbedUrl}
                          className="w-full h-72"
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="settings-card mt-6">
                <CardContent className="settings-card-content space-y-4">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onUseCurrentLocation}
                      disabled={!form.watch("gpsEnabled")}
                    >
                      <Navigation className="mr-2 h-4 w-4" />
                      {
                        ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES.MAP_SEARCH
                          .USE_CURRENT_LOCATION
                      }
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (!hasValidCoordinates && !mapSearchQuery) {
                          toast.error(
                            ATTENDANCE_SETTINGS_CONSTANTS.VALIDATION
                              .INVALID_COORDINATE,
                          );
                          return;
                        }
                        const mapsQuery =
                          mapSearchQuery || `${latitude},${longitude}`;
                        window.open(
                          `https://www.google.com/maps?q=${encodeURIComponent(mapsQuery)}`,
                          "_blank",
                        );
                      }}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      {
                        ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES.MAP_SEARCH
                          .OPEN_GOOGLE_MAPS
                      }
                    </Button>
                  </div>

                  <div className="overflow-hidden rounded-xl border bg-white">
                    <iframe
                      title="Google Maps Preview"
                      src={googleMapsEmbedUrl}
                      className="w-full h-72"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="settings-card mt-6">
                <CardHeader className="pb-4 border-b mb-6">
                  <CardTitle className="text-lg font-semibold leading-none tracking-tight">
                    {
                      ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES
                        .BRANCH_LOCATIONS.SECTION_TITLE
                    }
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    {
                      ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES
                        .BRANCH_LOCATIONS.SECTION_DESC
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="settings-card-content space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="font-medium text-foreground">
                        {
                          ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES
                            .BRANCH_LOCATIONS.BRANCH_NAME_LABEL
                        }
                      </label>
                      <Input
                        value={branchLocationDraft.name}
                        onChange={(event) =>
                          setBranchLocationDraft((prev) => ({
                            ...prev,
                            name: event.target.value,
                          }))
                        }
                        placeholder={
                          ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES
                            .BRANCH_LOCATIONS.BRANCH_NAME_PLACEHOLDER
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="font-medium text-foreground">
                        {
                          ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES
                            .BRANCH_LOCATIONS.BRANCH_ADDRESS_LABEL
                        }
                      </label>
                      <Input
                        value={branchLocationDraft.address}
                        onChange={(event) =>
                          setBranchLocationDraft((prev) => ({
                            ...prev,
                            address: event.target.value,
                          }))
                        }
                        placeholder={
                          ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES
                            .BRANCH_LOCATIONS.BRANCH_ADDRESS_PLACEHOLDER
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="font-medium text-foreground">
                        {
                          ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES
                            .BRANCH_LOCATIONS.LATITUDE_LABEL
                        }
                      </label>
                      <Input
                        type="number"
                        step="any"
                        value={branchLocationDraft.latitude}
                        onChange={(event) =>
                          setBranchLocationDraft((prev) => ({
                            ...prev,
                            latitude: event.target.value,
                          }))
                        }
                        className="font-mono"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="font-medium text-foreground">
                        {
                          ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES
                            .BRANCH_LOCATIONS.LONGITUDE_LABEL
                        }
                      </label>
                      <Input
                        type="number"
                        step="any"
                        value={branchLocationDraft.longitude}
                        onChange={(event) =>
                          setBranchLocationDraft((prev) => ({
                            ...prev,
                            longitude: event.target.value,
                          }))
                        }
                        className="font-mono"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="font-medium text-foreground">
                        {
                          ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES
                            .BRANCH_LOCATIONS.RADIUS_LABEL
                        }
                      </label>
                      <Input
                        type="number"
                        min={ATTENDANCE_SETTINGS_SCHEMA.radius.min}
                        max={ATTENDANCE_SETTINGS_SCHEMA.radius.max}
                        value={branchLocationDraft.radiusMeters}
                        onChange={(event) =>
                          setBranchLocationDraft((prev) => ({
                            ...prev,
                            radiusMeters: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-end justify-between rounded-lg border px-4 py-3">
                      <div>
                        <p className="font-medium">
                          {
                            ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES
                              .BRANCH_LOCATIONS.ACTIVE_LABEL
                          }
                        </p>
                      </div>
                      <Switch
                        checked={branchLocationDraft.isActive}
                        onCheckedChange={(checked) =>
                          setBranchLocationDraft((prev) => ({
                            ...prev,
                            isActive: checked,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={onCreateBranchLocation}
                      disabled={createOfficeLocationMutation.isPending}
                    >
                      {createOfficeLocationMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {
                        ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES
                          .BRANCH_LOCATIONS.ADD_BUTTON
                      }
                    </Button>
                  </div>

                  {officeLocations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {
                        ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES
                          .BRANCH_LOCATIONS.EMPTY_MESSAGE
                      }
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {officeLocations.map((office) => (
                        <div
                          key={office.id}
                          className="rounded-lg border p-3 space-y-1"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-medium">{office.name}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {office.isActive
                                  ? ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES
                                      .BRANCH_LOCATIONS.ACTIVE_STATUS
                                  : ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES
                                      .BRANCH_LOCATIONS.INACTIVE_STATUS}
                              </span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-red-600 hover:text-red-700"
                                onClick={() =>
                                  onDeleteOfficeLocation(office.id)
                                }
                                disabled={
                                  deleteOfficeLocationMutation.isPending
                                }
                              >
                                <Trash2 className="mr-1 h-3.5 w-3.5" />
                                {
                                  ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES
                                    .BRANCH_LOCATIONS.DELETE_BUTTON
                                }
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {office.address ||
                              ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES
                                .BRANCH_LOCATIONS.ADDRESS_FALLBACK}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {
                              ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES
                                .BRANCH_LOCATIONS.COORDINATE_PREFIX
                            }
                            : {office.latitude.toFixed(6)},{" "}
                            {office.longitude.toFixed(6)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {
                              ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES
                                .BRANCH_LOCATIONS.RADIUS_PREFIX
                            }
                            : {office.radiusMeters}m
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t">
              <Button type="button" variant="outline" onClick={handleReset}>
                {ATTENDANCE_SETTINGS_CONSTANTS.BUTTONS.CANCEL}
              </Button>
              <Button
                type="submit"
                disabled={updateOfficeConfigMutation.isPending}
              >
                {updateOfficeConfigMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {ATTENDANCE_SETTINGS_CONSTANTS.BUTTONS.SAVE}
              </Button>
            </div>
          </form>
        </Form>
      </Tabs>
    </main>
  );
}
